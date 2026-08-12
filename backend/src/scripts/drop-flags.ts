import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Dropping feature_flags table...");
    await db.execute(sql`DROP TABLE IF EXISTS feature_flags CASCADE`);
    console.log("Dropped.");
    process.exit(0);
}

main();
