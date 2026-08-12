import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Adding vector extension...");
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
        console.log("Vector extension added successfully.");
        process.exit(0);
    } catch(err) {
        console.error("Error adding extension:", err);
        process.exit(1);
    }
}
run();
