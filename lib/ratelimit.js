import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis;
function getRedis() {
  if (!_redis) _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

let _authLimiter, _apiLimiter, _matchLimiter;

export function getAuthLimiter() {
  if (!_authLimiter) _authLimiter = new Ratelimit({ redis: getRedis(), limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "ratelimit:auth" });
  return _authLimiter;
}

export function getApiLimiter() {
  if (!_apiLimiter) _apiLimiter = new Ratelimit({ redis: getRedis(), limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "ratelimit:api" });
  return _apiLimiter;
}

export function getMatchLimiter() {
  if (!_matchLimiter) _matchLimiter = new Ratelimit({ redis: getRedis(), limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "ratelimit:match" });
  return _matchLimiter;
}

// Derive a trustworthy client IP for rate-limit keys.
// `x-forwarded-for` can be a comma list where a client prepends spoofed values,
// so using the raw header lets an attacker rotate the key and defeat the limiter.
// On Vercel, `x-real-ip` is set by the platform to the actual connecting IP and
// cannot be spoofed; prefer it, and otherwise take only the FIRST hop appended
// by our own proxy (right-most is the most recently added by the edge).
export function getClientIp(headersList) {
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = headersList.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}

export async function checkRateLimit(limiterFn, identifier) {
  const limiter = typeof limiterFn === "function" ? limiterFn() : limiterFn;
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  if (!success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", "X-RateLimit-Limit": limit.toString(), "X-RateLimit-Remaining": remaining.toString(), "X-RateLimit-Reset": reset.toString() } }
    );
  }
  return null;
}
