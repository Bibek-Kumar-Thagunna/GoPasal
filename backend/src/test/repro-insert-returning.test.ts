
import { describe, it, expect } from "bun:test";
import { db } from "@/db";
import { ledgerAccounts } from "@/db/schema";
import { generateId } from "@/utils";

describe("Drizzle Insert Returning Repro", () => {
    it("should insert and return value", async () => {
        const id = generateId();
        const result = await db.insert(ledgerAccounts).values({
            id,
            name: "TEST_REPRO_" + id,
            type: "ASSET",
            balance: "0",
            description: "Repro Test"
        }).returning();

        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(id);
    });
});
