
import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Enabling vector extension...");
    try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
        console.log("Vector extension enabled successfully.");
    } catch (error) {
        console.error("Failed to enable vector extension:", error);
    }
    process.exit(0);
}

main();
