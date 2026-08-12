import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running migration manually...");
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_token" text;`);
    console.log("Done.");
    process.exit(0);
}
main();
