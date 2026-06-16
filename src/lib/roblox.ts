// Roblox Open Cloud API client.
// Docs: https://create.roblox.com/docs/cloud/open-cloud/usage

const ROBLOX_API_BASE_URL = process.env.ROBLOX_API_BASE_URL ?? "https://apis.roblox.com";

export interface RobloxValidationResult {
  valid: boolean;
  error?: string;
  username?: string;
  displayName?: string;
}

export interface RobloxUploadResult {
  success: boolean;
  assetId?: string;
  assetUrl?: string;
  error?: string;
  operationId?: string;
  status?: string;
}

export async function validateRobloxCredentials(
  creatorId: string,
  apiKey: string,
): Promise<RobloxValidationResult> {
  try {
    // Step 1: Validate API key by listing recent assets (a benign read).
    // We use the legacy assets endpoint as a key sanity check.
    const response = await fetch(
      `${ROBLOX_API_BASE_URL}/assets/v1/creator/${encodeURIComponent(creatorId)}/assets?limit=1`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
        // 8s timeout to fail fast
        signal: AbortSignal.timeout(8000),
      },
    );

    if (response.status === 200) {
      return { valid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        error: "API key invalid or missing required scopes (asset, asset-delivery).",
      };
    }

    if (response.status === 404) {
      return {
        valid: false,
        error: "Creator ID not found. Double-check the numeric Creator ID.",
      };
    }

    if (response.status === 429) {
      return {
        valid: false,
        error: "Roblox rate-limited the request. Please try again in a moment.",
      };
    }

    const text = await response.text();
    return {
      valid: false,
      error: `Roblox returned status ${response.status}: ${text.slice(0, 200)}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      valid: false,
      error: `Could not reach Roblox: ${message}`,
    };
  }
}

export async function uploadAudioToRoblox(
  fileBuffer: ArrayBuffer,
  fileName: string,
  contentType: string,
  creatorId: string,
  apiKey: string,
): Promise<RobloxUploadResult> {
  try {
    // Step 1: Initiate the upload. The endpoint returns an operationId we poll.
    const initResponse = await fetch(
      `${ROBLOX_API_BASE_URL}/assets/v1/creator/${encodeURIComponent(creatorId)}/assets?assetType=Audio&displayName=${encodeURIComponent(stripExtension(fileName))}&description=Uploaded+via+RoAudio&fileSize=${fileBuffer.byteLength}`,
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": contentType,
          Accept: "application/json",
        },
        body: fileBuffer,
        signal: AbortSignal.timeout(60000),
      },
    );

    if (initResponse.status === 401 || initResponse.status === 403) {
      return {
        success: false,
        error: "API key invalid or missing required scopes (asset, asset-delivery).",
      };
    }

    if (!initResponse.ok) {
      const text = await initResponse.text();
      return {
        success: false,
        error: `Roblox rejected the upload (status ${initResponse.status}): ${text.slice(0, 300)}`,
      };
    }

    const initData = (await initResponse.json()) as {
      path?: string;
      operationId?: string;
    };

    if (!initData.path) {
      return {
        success: false,
        error: "Roblox did not return a path to poll. Response was empty.",
      };
    }

    // Step 2: Poll the operation status until it succeeds or fails.
    const operationId = initData.path; // path === operationId
    const maxAttempts = 30;
    const pollIntervalMs = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(pollIntervalMs);

      const pollResponse = await fetch(
        `${ROBLOX_API_BASE_URL}${operationId}`,
        {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!pollResponse.ok) {
        continue;
      }

      const pollData = (await pollResponse.json()) as {
        done?: boolean;
        response?: { assetId?: string };
        error?: { message?: string; code?: number };
      };

      if (pollData.done && pollData.response?.assetId) {
        const assetId = pollData.response.assetId;
        return {
          success: true,
          assetId,
          assetUrl: `https://www.roblox.com/library/${assetId}`,
          operationId,
          status: "completed",
        };
      }

      if (pollData.done && pollData.error) {
        return {
          success: false,
          error: `Roblox processing failed: ${pollData.error.message ?? "unknown error"} (code ${pollData.error.code ?? "?"})`,
          operationId,
          status: "failed",
        };
      }
    }

    return {
      success: false,
      error: "Upload is taking too long. Check the operation status in Roblox dashboard.",
      operationId,
      status: "timeout",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("timeout") || message.includes("aborted")) {
      return {
        success: false,
        error: "Upload timed out. The file may be too large or your connection is slow.",
      };
    }
    return {
      success: false,
      error: `Upload failed: ${message}`,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}
