import { success } from "@/lib/api-response";

export const runtime = "edge";

export async function GET() {
  return success({
    status: "ok",
    service: "roaudio",
    timestamp: new Date().toISOString(),
  });
}
