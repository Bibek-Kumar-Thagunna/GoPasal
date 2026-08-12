import { Elysia } from "elysia";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.resetAt < now) store.delete(key);
    }
}, 5 * 60 * 1000);

export function rateLimit(opts: { max: number; windowMs: number; prefix?: string }) {
    return new Elysia({ name: `rate-limit-${opts.prefix || "global"}` })
        .onBeforeHandle({ as: "scoped" }, ({ request, set }) => {
            const ip = request.headers.get("x-forwarded-for")
                || request.headers.get("x-real-ip")
                || "unknown";
            const key = `${opts.prefix || ""}:${ip}`;
            const now = Date.now();

            let entry = store.get(key);
            if (!entry || entry.resetAt < now) {
                entry = { count: 0, resetAt: now + opts.windowMs };
                store.set(key, entry);
            }

            entry.count++;

            // Set rate limit headers
            set.headers["X-RateLimit-Limit"] = String(opts.max);
            set.headers["X-RateLimit-Remaining"] = String(Math.max(0, opts.max - entry.count));
            set.headers["X-RateLimit-Reset"] = String(Math.ceil(entry.resetAt / 1000));

            if (entry.count > opts.max) {
                set.status = 429;
                return {
                    success: false,
                    error: {
                        code: "RATE_LIMIT_EXCEEDED",
                        message: "Too many requests. Please try again later.",
                    },
                };
            }
        });
}
