import { db, type DbTransaction } from "@/db";
import { ledgerAccounts, ledgerEntries } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId, NotFoundError, ValidationError } from "@/utils";

type LedgerEntryInput = {
    accountId: string;
    type: "DEBIT" | "CREDIT";
    amount: number;
    description?: string;
};

export class LedgerService {
    // --- Account Management ---

    async ensureAccount(name: string, type: string, tenantId?: string, description?: string, tx: DbTransaction = db as any) {
        const [existing] = await tx
            .select()
            .from(ledgerAccounts)
            .where(
                and(
                    eq(ledgerAccounts.name, name),
                    tenantId ? eq(ledgerAccounts.tenantId, tenantId) : sql`${ledgerAccounts.tenantId} IS NULL`
                )
            );

        if (existing) return existing;

        const id = generateId();
        const [account] = await tx
            .insert(ledgerAccounts)
            .values({
                id,
                name,
                type,
                tenantId: tenantId || null,
                description,
                balance: "0",
            })
            .returning();

        return account;
    }

    async getAccountBalance(accountId: string, tx: any = db) {
        // Source of truth: Sum of Entries
        // Balance = Sum(DEBIT) - Sum(CREDIT) (for Asset/Expense) 
        // OR Sum(CREDIT) - Sum(DEBIT) (for Liability/Equity/Revenue)

        const [account] = await tx.select().from(ledgerAccounts).where(eq(ledgerAccounts.id, accountId));
        if (!account) throw new NotFoundError("Ledger Account not found");

        const result = await tx
            .select({
                debits: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerEntries.type} = 'DEBIT' THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
                credits: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerEntries.type} = 'CREDIT' THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
            })
            .from(ledgerEntries)
            .where(eq(ledgerEntries.accountId, accountId));

        const { debits, credits } = result[0];

        // Simple convention: Asset/Expense naturally Debit-heavy. Liability/Revenue naturally Credit-heavy.
        // We return raw totals for the caller to interpret or a signed net.
        return { debits: Number(debits), credits: Number(credits) };
    }

    // --- Journal Posting ---

    async postJournal(
        referenceType: string,
        referenceId: string,
        entries: LedgerEntryInput[],
        idempotencyKey?: string,
        tx: any = db
    ) {
        // 1. Validate Balance
        const totalDebit = entries
            .filter((e) => e.type === "DEBIT")
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const totalCredit = entries
            .filter((e) => e.type === "CREDIT")
            .reduce((sum, e) => sum + Number(e.amount), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) { // Floating point tolerance
            throw new ValidationError(`Ledger entries must balance. Debit: ${totalDebit}, Credit: ${totalCredit}`);
        }

        // 2. Check Idempotency (if key provided)
        if (idempotencyKey) {
            const [existing] = await tx
                .select()
                .from(ledgerEntries)
                .where(eq(ledgerEntries.idempotencyKey, `${idempotencyKey}:0`))
                .limit(1);

            if (existing) {
                // Already posted. Return existing Journal ID.
                return existing.journalId;
            }
        }

        // 3. Write Entries
        const journalId = generateId();
        const rows = entries.map((entry, idx) => ({
            id: generateId(),
            journalId,
            accountId: entry.accountId,
            referenceType,
            referenceId,
            type: entry.type,
            amount: String(entry.amount),
            description: entry.description,
            idempotencyKey: idempotencyKey ? `${idempotencyKey}:${idx}` : undefined,
        }));

        await tx.insert(ledgerEntries).values(rows);

        // 4. Update Cached Balances (Optional, for perf)
        // We skip this for now to rely on immutable event log source-of-truth.

        return journalId;
    }
}

export const ledgerService = new LedgerService();
