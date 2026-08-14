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

function rateLimitConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

let _warnedUnconfigured = false;

export async function checkRateLimit(limiterFn, identifier) {
  // Without Upstash credentials the limiter cannot reach Redis and the call
  // throws, which surfaced as a bare 500 on registration, login and every other
  // limited route. Locally that made the app impossible to run at all unless you
  // had copied production Redis credentials onto your laptop, which is a worse
  // idea than not rate limiting your own machine.
  if (!rateLimitConfigured()) {
    if (!_warnedUnconfigured) {
      _warnedUnconfigured = true;
      console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is DISABLED. " +
        "Expected in local development. If you see this in production, the auth endpoints are unthrottled."
      );
    }
    return null;
  }

  let result;
  try {
    const limiter = typeof limiterFn === "function" ? limiterFn() : limiterFn;
    result = await limiter.limit(identifier);
  } catch (err) {
    // A Redis blip should not take down login. Rate limiting is defence in
    // depth here, not the access control itself, so a failed check allows the
    // request and says so loudly rather than turning an outage at Upstash into
    // an outage at SwapTest.
    console.error("[ratelimit] check failed, allowing request:", err?.message);
    return null;
  }

  const { success, limit, reset, remaining } = result;
  if (!success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", "X-RateLimit-Limit": limit.toString(), "X-RateLimit-Remaining": remaining.toString(), "X-RateLimit-Reset": reset.toString() } }
    );
  }
  return null;
}
