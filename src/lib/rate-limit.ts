// Lightweight in-memory token-bucket rate limiter.
// For Vercel, this is per-instance. For multi-region, use a KV store instead.

type Bucket = { tokens: number; lastRefill: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  capacity: number; // max tokens
  refillRate: number; // tokens per second
}

export const DEFAULT_RL: RateLimitConfig = {
  capacity: 30,
  refillRate: 30 / 60, // 30 per minute
};

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RL,
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const bucket = buckets.get(identifier) ?? {
    tokens: config.capacity,
    lastRefill: now,
  };

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refilled = Math.min(
    config.capacity,
    bucket.tokens + elapsed * config.refillRate,
  );

  if (refilled < 1) {
    buckets.set(identifier, { tokens: refilled, lastRefill: now });
    return {
      success: false,
      remaining: 0,
      reset: now + ((1 - refilled) / config.refillRate) * 1000,
    };
  }

  const newBucket = { tokens: refilled - 1, lastRefill: now };
  buckets.set(identifier, newBucket);

  return {
    success: true,
    remaining: Math.floor(newBucket.tokens),
    reset: now,
  };
}

export function getClientIdentifier(headers: Headers): string {
  // Use Vercel's IP header, fall back to x-forwarded-for, then a default
  const ip =
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "anonymous";
  return ip;
}

// Periodic cleanup of stale buckets to prevent memory growth
let cleanupStarted = false;
export function startRateLimitCleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  if (typeof setInterval === "undefined") return;
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      // Drop buckets that are full and have been idle for 10+ minutes
      if (now - bucket.lastRefill > 10 * 60 * 1000 && bucket.tokens >= DEFAULT_RL.capacity) {
        buckets.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
