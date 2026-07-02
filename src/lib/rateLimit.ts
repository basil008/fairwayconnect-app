/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Good enough for a single Fly.io machine (the current deployment).
 * NOTE: state is per-process — if the app scales to multiple machines,
 * replace with a shared store (Turso table or Upstash Redis).
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map doesn't grow unbounded
let lastSweep = Date.now();
function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter(t => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

/**
 * Returns true if the call is ALLOWED, false if rate-limited.
 * @param key      e.g. `pin:${ip}`
 * @param limit    max attempts per window
 * @param windowMs window size in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  sweep(windowMs);
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter(t => now - t < windowMs);
  if (bucket.timestamps.length >= limit) return false;
  bucket.timestamps.push(now);
  return true;
}

/** Best-effort client IP extraction behind Fly.io's proxy. */
export function clientIp(req: Request): string {
  return (
    req.headers.get('fly-client-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
