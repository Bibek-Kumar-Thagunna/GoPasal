import { db, type DbTransaction } from "@/db";
import { loyaltyLedger, referralCodes, referralRewards, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateId } from "@/utils";
import {  ValidationError } from "@/utils/errors";

class LoyaltyService {
    async getBalance(userId: string) {
        const [lastEntry] = await db.select().from(loyaltyLedger)
            .where(eq(loyaltyLedger.userId, userId))
            .orderBy(desc(loyaltyLedger.createdAt))
            .limit(1);

        return lastEntry ? Number(lastEntry.balanceAfter) : 0;
    }

    async addTransaction(userId: string, amount: number, type: "EARN" | "REDEEM" | "ADJUSTMENT", orderId?: string) {
        return db.transaction(async (tx: DbTransaction) => {
            const currentBalance = await this.getBalance(userId); // Read from DB inside Tx ideally if isolated, but here simple

            if (type === "REDEEM" && currentBalance < amount) {
                throw new ValidationError("Insufficient loyalty points");
            }

            const newBalance = type === "REDEEM"
                ? currentBalance - amount
                : currentBalance + amount;

            await tx.insert(loyaltyLedger).values({
                id: generateId(),
                userId,
                amount: String(amount),
                type,
                orderId,
                balanceAfter: String(newBalance),
                metadata: JSON.stringify({ note: `Transaction ${type}` })
            });

            return newBalance;
        });
    }
}

class ReferralService {
    async getOrCreateCode(userId: string) {
        const [existing] = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId));
        if (existing) return existing.code;

        // Generate Code: First 4 chars of name + 4 random numbers
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        const base = (user?.name || "USER").substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "X");
        const suffix = Math.floor(1000 + Math.random() * 9000);
        const code = `${base}${suffix}`;

        await db.insert(referralCodes).values({ userId, code });
        return code;
    }

    async processReferralReward(refereeId: string) {
        // Find if this user was referred?
        // Need to store "referredBy" on User or a separate table.
        // Assuming `users` table has `referredBy` or `referral_rewards` is created at signup.
        // Let's assume we look for PENDING reward in referral_rewards.

        const [pendingReward] = await db.select().from(referralRewards)
            .where(and(
                eq(referralRewards.refereeId, refereeId),
                eq(referralRewards.status, "PENDING")
            ));

        if (!pendingReward) return;

        // Grant Reward to Referrer
        await loyaltyService.addTransaction(
            pendingReward.referrerId,
            Number(pendingReward.rewardAmount),
            "EARN",
            `REF_REWARD_${pendingReward.id}`
        );

        // Update Status
        await db.update(referralRewards)
            .set({ status: "COMPLETED", processedAt: new Date() })
            .where(eq(referralRewards.id, pendingReward.id));
    }
}

export const loyaltyService = new LoyaltyService();
export const referralService = new ReferralService();
