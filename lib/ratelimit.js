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
