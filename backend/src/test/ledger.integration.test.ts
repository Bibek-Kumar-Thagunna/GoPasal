import { describe, expect, it, beforeAll } from "bun:test";
import { ledgerService } from "@/modules/payment/ledger.service";
import { db } from "@/db";
import {  ledgerEntries } from "@/db/schema";
import { sql } from "drizzle-orm";
import { generateId } from "@/utils";

describe("Ledger System (Double Entry)", () => {
    let cashAccountId: string;
    let revenueAccountId: string;

    beforeAll(async () => {
        // Setup Accounts
        const cash = await ledgerService.ensureAccount("TEST:CASH", "ASSET");
        const revenue = await ledgerService.ensureAccount("TEST:REVENUE", "REVENUE");
        cashAccountId = cash.id;
        revenueAccountId = revenue.id;
    });

    it("should reject unbalanced entries", async () => {
        const promise = ledgerService.postJournal(
            "TEST",
            "ref-001",
            [
                { accountId: cashAccountId, type: "DEBIT", amount: 100 },
                { accountId: revenueAccountId, type: "CREDIT", amount: 50 }, // Unbalanced
            ]
        );
        expect(promise).rejects.toThrow("Ledger entries must balance");
    });

    it("should post balanced journal and be idempotent", async () => {
        const idempotencyKey = "txn-" + generateId();

        // First Post
        const journalId1 = await ledgerService.postJournal(
            "TEST",
            "ref-002",
            [
                { accountId: cashAccountId, type: "DEBIT", amount: 100 },
                { accountId: revenueAccountId, type: "CREDIT", amount: 100 },
            ],
            idempotencyKey
        );

        expect(journalId1).toBeDefined();

        // Second Post (Duplicate Key)
        const journalId2 = await ledgerService.postJournal(
            "TEST",
            "ref-002",
            [
                { accountId: cashAccountId, type: "DEBIT", amount: 100 },
                { accountId: revenueAccountId, type: "CREDIT", amount: 100 },
            ],
            idempotencyKey
        );

        expect(journalId2).toBe(journalId1); // Should match

        // Verify only 2 entries exist for this transaction
        const entries = await db.select().from(ledgerEntries).where(sql`${ledgerEntries.idempotencyKey} LIKE ${idempotencyKey + "%"}`);
        expect(entries.length).toBe(2);
    });

    it("should calculate balance correctly", async () => {
        const balance = await ledgerService.getAccountBalance(cashAccountId);
        // We debited 100
        expect(balance.debits).toBeGreaterThanOrEqual(100);
    });
});
