/**
 * In-memory fixed-window rate limiter, keyed by client IP.
 *
 * This is per-instance, not shared across a multi-instance serverless
 * deployment — it's a real limit that stops any single request stream from
 * hammering platform API quota, not a promise of global fairness. When
 * authenticated tiers (planning doc section 51) ship, replace with a shared
 * store (e.g. Upstash Redis) behind this same `checkRateLimit` call site.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodically forget stale buckets so this doesn't grow unbounded on a long-lived instance.
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAtMs: now + windowMs };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAtMs: existing.windowStart + windowMs,
  };
}

export function getClientKey(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
