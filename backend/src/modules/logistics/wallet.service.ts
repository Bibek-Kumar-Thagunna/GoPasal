import { db, type DbTransaction } from "@/db";
import { riders, riderDeposits } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { generateId } from "@/utils";
import { ValidationError, NotFoundError } from "@/utils/errors";

export class WalletService {

    async checkLimit(riderId: string, incomingAmount: number): Promise<boolean> {
        const [rider] = await db.select().from(riders).where(eq(riders.id, riderId));
        if (!rider) throw new NotFoundError("Rider not found");

        const currentCash = Number(rider.codCashInHand || 0);
        const limit = Number(rider.maxWalletLimit || 5000);

        return (currentCash + incomingAmount) <= limit;
    }

    async recordCollection(riderId: string, amount: number) {
        await db.update(riders)
            .set({
                codCashInHand: sql`${riders.codCashInHand} + ${String(amount)}`,
                updatedAt: new Date()
            })
            .where(eq(riders.id, riderId));
    }

    async listDeposits() {
        return db.select()
            .from(riderDeposits)
            .orderBy(desc(riderDeposits.createdAt));
    }

    async recordDeposit(riderId: string, amount: number, refCode?: string, proofUrl?: string) {
        const id = generateId();
        await db.insert(riderDeposits).values({
            id,
            riderId,
            amount: String(amount),
            status: "PENDING",
            referenceCode: refCode,
            proofUrl,
        });
        return id;
    }

    async verifyDeposit(depositId: string, adminId: string) {
        return db.transaction(async (tx: DbTransaction) => {
            const [deposit] = await tx.select().from(riderDeposits).where(eq(riderDeposits.id, depositId));
            if (!deposit) throw new NotFoundError("Deposit not found");
            if (deposit.status !== "PENDING") throw new ValidationError("Deposit already processed");

            // 1. Update Deposit
            await tx.update(riderDeposits)
                .set({ status: "VERIFIED", verifiedBy: adminId, verifiedAt: new Date() })
                .where(eq(riderDeposits.id, depositId));

            // 2. Reduce Cash In Hand
            await tx.update(riders)
                .set({
                    codCashInHand: sql`${riders.codCashInHand} - ${deposit.amount}`,
                    updatedAt: new Date()
                })
                .where(eq(riders.id, deposit.riderId));
        });
    }
}

export const walletService = new WalletService();
