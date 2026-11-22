import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const enabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Без переменных Upstash лимит отключён (удобно для локальной разработки)
const limiter = enabled
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "assistant",
    })
  : null;

export async function checkRateLimit(id: string): Promise<boolean> {
  if (!limiter) return true;
  const { success } = await limiter.limit(id);
  return success;
}
