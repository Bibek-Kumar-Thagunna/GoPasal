import { db } from "./src/db";
import { stores, users } from "./src/db/schema";
import { desc, eq } from "drizzle-orm";

async function main() {
    const s = await db.select().from(stores).orderBy(desc(stores.createdAt)).limit(1);
    console.log("Latest store:", s[0]);
    if (s[0]) {
        const u = await db.select().from(users).where(eq(users.id, s[0].ownerId)).limit(1);
        console.log("Owner info:", u[0].phone);
    }
    process.exit(0);
}
main();
