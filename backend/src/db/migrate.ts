import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, closeConnection } from "./connection";
import { logger } from "@/utils";

async function runMigrations() {
    logger.info("Running database migrations...");

    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        logger.info("Migrations completed successfully");
    } catch (err) {
        logger.error("Migration failed", { error: (err as Error).message });
        process.exit(1);
    } finally {
        await closeConnection();
    }
}

runMigrations();
