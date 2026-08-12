import { db } from "@/db";
import { coupons, loyaltyLedger } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId, NotFoundError, ConflictError } from "@/utils";
import { PLATFORM_PROMO_STORE_ID } from "@/config/commerce";

export class GrowthService {
    // --- Coupons ---
    async createCoupon(storeId: string, data: Record<string, unknown>) {
        const id = generateId();
        await db.insert(coupons).values({
            id,
            storeId,
            ...data,
        } as typeof coupons.$inferInsert);
        return { success: true, id };
    }

    async listCouponsForStore(storeId: string) {
        return db
            .select()
            .from(coupons)
            .where(eq(coupons.storeId, storeId))
            .orderBy(desc(coupons.createdAt));
    }

    async validateCoupon(code: string, storeId?: string, orderValue = 0) {
        const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
        if (!coupon) throw new NotFoundError("Coupon not found");
        if (coupon.status !== "ACTIVE") throw new ConflictError("Coupon expired");
        if (
            coupon.storeId !== PLATFORM_PROMO_STORE_ID &&
            (!storeId || coupon.storeId !== storeId)
        ) {
            throw new ConflictError("Coupon not valid for this store");
        }

        // Logic for discount calc
        let discount = 0;
        if (coupon.type === "FIXED") discount = Number(coupon.value);
        else discount = (orderValue * Number(coupon.value)) / 100;

        return { valid: true, discount };
    }

    // --- Referrals ---
    async createReferralCode(userId: string, code: string) {
        // A referral code is derived deterministically from the user id so it is
        // always consistent and requires no extra table. The provided `code`
        // argument is ignored in favor of the derived value.
        const derived = `REF${Buffer.from(userId).toString("base64url").slice(0, 10).toUpperCase()}`;
        void code;
        return { code: derived };
    }

    // --- Loyalty ---
    async awardPoints(userId: string, points: number) {
        // 1. Get current balance
        const [lastEntry] = await db.select()
            .from(loyaltyLedger)
            .where(eq(loyaltyLedger.userId, userId))
            .orderBy(desc(loyaltyLedger.createdAt))
            .limit(1);

        const currentBalance = lastEntry ? Number(lastEntry.balanceAfter) : 0;
        const newBalance = currentBalance + points;

        // 2. Insert new entry
        await db.insert(loyaltyLedger).values({
            id: generateId(),
            userId,
            amount: String(points), // +/-
            type: "EARN",
            balanceAfter: String(newBalance),
            createdAt: new Date()
        });
    }
}

export const growthService = new GrowthService();
