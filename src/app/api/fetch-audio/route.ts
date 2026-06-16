import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, methodNotAllowed, serverError, success, tooManyRequests } from "@/lib/api-response";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  url: z.string().url().refine(
    (u) => u.startsWith("http://") || u.startsWith("https://"),
    "URL must be http or https",
  ),
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const FETCH_TIMEOUT_MS = 30000; // 30s

// SSRF protection — block private IP ranges
function isPrivateHost(hostname: string): boolean {
  // Block localhost, private IPv4, link-local
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return true;
  }
  // IPv4 private ranges
  const parts = hostname.split(".").map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 127) return true;
  }
  // IPv6 private (best-effort)
  if (hostname.startsWith("fe80:") || hostname.startsWith("fc") || hostname.startsWith("fd")) {
    return true;
  }
  return false;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "audio";
}

function extractFileName(url: string, contentType: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).pop();
    if (last && last.includes(".")) {
      return sanitizeFileName(decodeURIComponent(last));
    }
  } catch {
    // ignore
  }
  // Fallback based on content type
  const ext = contentType.split("/")[1]?.split(";")[0] ?? "mp3";
  return sanitizeFileName(`audio.${ext}`);
}

export async function POST(request: NextRequest) {
  // Rate limit
  const id = getClientIdentifier(request.headers);
  const rl = rateLimit(`fetch-audio:${id}`, { capacity: 20, refillRate: 20 / 60 });
  if (!rl.success) {
    return tooManyRequests(rl.reset);
  }

  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid URL", parsed.error.flatten().fieldErrors);
    }

    const { url } = parsed.data;

    // SSRF check
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return badRequest("Invalid URL");
    }

    if (isPrivateHost(parsedUrl.hostname)) {
      return badRequest("Cannot fetch from private/internal hosts");
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "RoAudio/1.0",
        Accept: "audio/*",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return badRequest(`Remote returned ${response.status}`);
    }

    // Check content length
    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
      return badRequest(`Remote file too large (${contentLength} bytes)`);
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    if (!contentType.startsWith("audio/")) {
      return badRequest(`Remote content is not audio (got ${contentType})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return badRequest(`Remote file too large (${arrayBuffer.byteLength} bytes)`);
    }

    // Encode to base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunk)),
      );
    }
    const fileBase64 = btoa(binary);
    const fileName = extractFileName(url, contentType);

    return success({
      fileBase64,
      contentType,
      fileSize: arrayBuffer.byteLength,
      fileName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    if (message.includes("aborted") || message.includes("timeout")) {
      return badRequest("Fetch timed out — file too slow or too large");
    }
    return serverError(message);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
