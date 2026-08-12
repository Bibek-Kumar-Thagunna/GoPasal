import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Truncates every user table in the connected database.
 *
 * Refuses to run against anything that is not a dedicated test database
 * (name ends with `_test`) so a stray invocation can never wipe dev/prod data.
 *
 * Usage:  bun run src/test/truncate.ts
 */
const current = await db.execute(sql`select current_database() as db`);
const rows = current as { db?: string }[];
const dbName = rows[0]?.db ?? "";

if (!dbName.endsWith("_test")) {
    console.error(
        `Refusing to truncate "${dbName}" — not a test database (name must end in _test).`
    );
    process.exit(1);
}

await db.execute(
    sql`DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '__drizzle_migrations'
    LOOP
        EXECUTE format('TRUNCATE TABLE %I CASCADE', r.tablename);
    END LOOP;
END $$;`
);

console.log(`Truncated all tables in "${dbName}".`);
process.exit(0);
