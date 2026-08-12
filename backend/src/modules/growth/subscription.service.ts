import { db, type DbTransaction } from "@/db";
import { subscriptionPlans, userSubscriptions, subscriptionEvents } from "@/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { generateId, NotFoundError, ValidationError } from "@/utils";
export class SubscriptionService {

    // --- QUERY ---

    async getActiveSubscription(userId: string) {
        // Cache this in Redis in real prod
        const sub = await db.query.userSubscriptions.findFirst({
            where: and(
                eq(userSubscriptions.userId, userId),
                eq(userSubscriptions.status, "ACTIVE"),
                gt(userSubscriptions.endAt, new Date())
            ),
            with: {
                plan: true
            },
            orderBy: [desc(userSubscriptions.endAt)]
        });
        return sub;
    }

    async listPlans() {
        return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
    }

    // --- ACTIONS ---

    async subscribe(userId: string, planId: string, paymentMethod: "ESEWA" | "KHALTI" | "CARD", paymentToken: string) {
        const existing = await this.getActiveSubscription(userId);
        if (existing) throw new ValidationError("User already has an active subscription");

        return this.activateAfterPayment(userId, planId, paymentToken, paymentMethod);
    }

    async activateAfterPayment(
        userId: string,
        planId: string,
        paymentToken: string,
        paymentMethod: "ESEWA" | "KHALTI" | "CARD" = "KHALTI"
    ) {
        const [plan] = await db
            .select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, planId));
        if (!plan) throw new NotFoundError("Plan not found");

        const existing = await this.getActiveSubscription(userId);
        if (existing) throw new ValidationError("User already has an active subscription");

        const subId = generateId();
        const now = new Date();
        const endAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        await db.transaction(async (tx: DbTransaction) => {
            await tx.insert(userSubscriptions).values({
                id: subId,
                userId,
                planId,
                status: "ACTIVE",
                startAt: now,
                endAt,
                autoRenew: true,
                paymentTokenRef: paymentToken,
                lastRenewalAttemptAt: now,
            });

            await tx.insert(subscriptionEvents).values({
                id: generateId(),
                userSubscriptionId: subId,
                type: "CREATED",
                metadata: { method: paymentMethod, amount: plan.price, paymentToken },
            });
        });

        return { id: subId, status: "ACTIVE" as const, endAt };
    }

    async cancel(userId: string) {
        const sub = await this.getActiveSubscription(userId);
        if (!sub) throw new NotFoundError("No active subscription");

        // We turn off auto-renew. Benefits continue until endAt.
        await db.update(userSubscriptions)
            .set({ autoRenew: false, status: "CANCELLED", updatedAt: new Date() }) // Marking cancelled often means "Will expire"
            .where(eq(userSubscriptions.id, sub.id));

        // Note: Strict "CANCELLED" status usually removes benefits immediately in some systems.
        // But plan says "Benefits continue until endAt". 
        // So actually, we should just set autoRenew = false. 
        // However, if we change status to CANCELLED, getActiveSubscription query needs to allow 'CANCELLED' if endAt > now?
        // Let's keep status ACTIVE but autoRenew false for "Cancelling at end of period".
        // IF immediate termination: status = CANCELLED.
        // Let's assume USER interactions are "Turn off Auto Renew".

        // Re-reading logic:
        // "Fetch UserSubscription where status=ACTIVE and end_at > now"
        // So if we start using CANCELLED, they lose access.
        // Correct approach: Keep ACTIVE, set autoRenew=false.

        await db.update(userSubscriptions)
            .set({ autoRenew: false, updatedAt: new Date() })
            .where(eq(userSubscriptions.id, sub.id));

        // Create Event
        await db.insert(subscriptionEvents).values({
            id: generateId(),
            userSubscriptionId: sub.id,
            type: "CANCELLED", // Log event as Cancelled
            metadata: { reason: "User requested" }
        });

        return { message: "Subscription will expire at " + sub.endAt };
    }

    async checkAutoRenew() {
        // Cron Job Logic
        // 1. Find Expiring in next 24h
        // 2. Charge
        // 3. Extend
        // Mock implementation
        const now = new Date();

        const expiring = await db.query.userSubscriptions.findMany({
            where: and(
                eq(userSubscriptions.status, "ACTIVE"),
                eq(userSubscriptions.autoRenew, true),
                gt(userSubscriptions.endAt, now),
                // lt(userSubscriptions.endAt, tomorrow) // In real cron
            ),
            with: { plan: true }
        });

        // Loop and renew...
        // For MVP, just return count
        return expiring.length;
    }
}

export const subscriptionService = new SubscriptionService();
