import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config";
import { logger } from "@/utils";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL;

const queryClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => { },
});

export const db = drizzle(queryClient, { schema });

export async function testConnection(): Promise<boolean> {
    try {
        await queryClient`SELECT 1`;
        logger.info("Database connection established");
        return true;
    } catch (err) {
        logger.error("Database connection failed", {
            error: (err as Error).message,
        });
        return false;
    }
}

export async function closeConnection(): Promise<void> {
    await queryClient.end();
    logger.info("Database connection closed");
}
