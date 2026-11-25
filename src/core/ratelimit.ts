import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
    if (limiter !== undefined) return limiter;

    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

    limiter =
        url && token
            ? new Ratelimit({
                redis: new Redis({ url, token }),
                limiter: Ratelimit.slidingWindow(10, "1 m"),
                prefix: "assistant-en",
            })
            : null;
    return limiter;
}

export async function checkRateLimit(id: string): Promise<boolean> {
    const l = getLimiter();
    if (!l) return true;
    try {
        const { success } = await l.limit(id);
        return success;
    } catch (err) {
        console.error("ratelimit error", err);
        return true;
    }
}