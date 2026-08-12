import { db } from "./src/db";
import { otps } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyPassword } from "./src/utils/crypto";

async function main() {
    const records = await db.select().from(otps).orderBy(desc(otps.createdAt)).limit(1);
    console.log("LATEST ALIVE RECORD IN DB:");
    console.log(records[0]);
    
    // The user typed 956021.
    const result = await verifyPassword("956021", records[0].otpHash);
    console.log("VERIFY vs 956021:", result);

    process.exit(0);
}
main();
