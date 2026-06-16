import { NextRequest } from "next/server";
import { badRequest, methodNotAllowed, serverError, success, tooManyRequests } from "@/lib/api-response";
import { UploadToRobloxRequestSchema } from "@/lib/validations";
import { uploadAudioToRoblox } from "@/lib/roblox";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  // Stricter rate limit for uploads
  const id = getClientIdentifier(request.headers);
  const rl = rateLimit(`upload-roblox:${id}`, { capacity: 10, refillRate: 10 / 60 });
  if (!rl.success) {
    return tooManyRequests(rl.reset);
  }

  try {
    const body = await request.json();
    const parsed = UploadToRobloxRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        "Invalid request body",
        parsed.error.flatten().fieldErrors,
      );
    }

    const { fileBase64, fileName, contentType, creatorId, apiKey } = parsed.data;

    // Estimate size from base64
    const padding = fileBase64.endsWith("==") ? 2 : fileBase64.endsWith("=") ? 1 : 0;
    const estimatedSize = (fileBase64.length * 3) / 4 - padding;
    if (estimatedSize > MAX_FILE_SIZE) {
      return badRequest(
        `File too large: ${Math.round(estimatedSize / 1024 / 1024)}MB. Max is 50MB.`,
      );
    }

    // Decode base64 to ArrayBuffer
    const binary = atob(fileBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    const result = await uploadAudioToRoblox(
      arrayBuffer,
      fileName,
      contentType,
      creatorId,
      apiKey,
    );

    if (!result.success) {
      return success(
        { success: false, error: result.error, status: result.status },
        { status: 200 },
      );
    }

    return success({
      assetId: result.assetId,
      assetUrl: result.assetUrl,
      status: result.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return serverError(message);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
