import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, methodNotAllowed, serverError, success, tooManyRequests, unauthorized } from "@/lib/api-response";
import { ValidateRobloxRequestSchema } from "@/lib/validations";
import { validateRobloxCredentials } from "@/lib/roblox";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = ValidateRobloxRequestSchema.extend({
  creatorId: z.string().min(1).max(20),
  apiKey: z.string().min(20).max(200),
});

export async function POST(request: NextRequest) {
  // Rate limit
  const id = getClientIdentifier(request.headers);
  const rl = rateLimit(`validate-roblox:${id}`, { capacity: 15, refillRate: 15 / 60 });
  if (!rl.success) {
    return tooManyRequests(rl.reset);
  }

  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        "Invalid request body",
        parsed.error.flatten().fieldErrors,
      );
    }

    const { creatorId, apiKey } = parsed.data;
    const result = await validateRobloxCredentials(creatorId, apiKey);

    if (!result.valid) {
      return success({ valid: false, error: result.error }, { status: 200 });
    }

    return success({ valid: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("rate-limited")) {
      return unauthorized(message);
    }
    return serverError(message);
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
