import Redis from "ioredis";
import { env } from "@/config/env";
import { logger } from "@/shared/logger";

/**
 * Shared Redis client.
 *
 * - Production: REDIS_URL is mandatory (enforced at boot by config/env.ts).
 * - Development/test: falls back to an in-memory adapter with the same surface,
 *   so tests and local runs work without a Redis server. The mock is NEVER used
 *   in production (env.ts fails fast if REDIS_URL is missing there).
 */
class InMemoryRedis {
    private store = new Map<string, { value: string; expiresAt: number | null }>();

    async get(key: string): Promise<string | null> {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(
        key: string,
        value: string | number,
        mode?: string,
        duration?: number
    ): Promise<"OK"> {
        this.store.set(key, {
            value: String(value),
            expiresAt:
                mode === "EX" && typeof duration === "number"
                    ? Date.now() + duration * 1000
                    : null,
        });
        return "OK";
    }

    async del(key: string): Promise<number> {
        return this.store.delete(key) ? 1 : 0;
    }

    async decr(key: string): Promise<number> {
        const current = Number((await this.get(key)) ?? 0);
        const next = current - 1;
        this.store.set(key, { value: String(next), expiresAt: null });
        return next;
    }

    async incr(key: string): Promise<number> {
        const current = Number((await this.get(key)) ?? 0);
        const next = current + 1;
        this.store.set(key, { value: String(next), expiresAt: null });
        return next;
    }

    async incrby(key: string, amount: number): Promise<number> {
        const current = Number((await this.get(key)) ?? 0);
        const next = current + amount;
        this.store.set(key, { value: String(next), expiresAt: null });
        return next;
    }

    async quit(): Promise<"OK"> {
        this.store.clear();
        return "OK";
    }
}

export type RedisClient = {
    get(key: string): Promise<string | null>;
    set(key: string, value: string | number, mode?: string, duration?: number): Promise<unknown>;
    del(key: string): Promise<unknown>;
    decr(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    incrby(key: string, amount: number): Promise<number>;
    quit(): Promise<unknown>;
};

function createRedis(): RedisClient {
    const url = env.REDIS_URL?.trim();
    if (url) {
        const client = new Redis(url, {
            maxRetriesPerRequest: 2,
            lazyConnect: true,
            enableOfflineQueue: false,
            connectTimeout: 3000,
        });
        client.on("error", (err) => {
            logger.error({ err: String(err) }, "redis.connection.error");
        });
        client.connect().catch((err) => {
            logger.error({ err: String(err) }, "redis.connect.failed");
        });
        return client as unknown as RedisClient;
    }

    return new InMemoryRedis();
}

export const redis = createRedis();
