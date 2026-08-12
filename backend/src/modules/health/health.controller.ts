import { Elysia } from "elysia";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { logger } from "@/shared/logger";

export const healthController = new Elysia({ prefix: "/health" })
    .get("/", () => ({ status: "ok", timestamp: new Date() }))
    .get("/deep", async ({ set }) => {
        try {
            const start = Date.now();
            await db.execute(sql`SELECT 1`);
            const duration = Date.now() - start;

            return {
                status: "ok",
                db: "connected",
                latency: `${duration}ms`,
                timestamp: new Date()
            };
        } catch (error) {
            logger.error({ err: error }, "Health check failed");
            set.status = 503;
            return {
                status: "error",
                db: "disconnected",
                timestamp: new Date()
            };
        }
    });
