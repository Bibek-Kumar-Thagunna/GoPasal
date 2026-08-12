import { db, type DbTransaction } from "@/db";
import { storeMarketingPlans, storeMarketingSubscriptions } from "@/db/schema";
import { and, eq, gt, desc } from "drizzle-orm";
import type { StoreMarketingBenefits } from "@/types/plan-benefits";
import { generateId, NotFoundError, ValidationError } from "@/utils";

export function parseStoreMarketingBenefits(raw: unknown): StoreMarketingBenefits {
    if (!raw || typeof raw !== "object") return {};
    return raw as StoreMarketingBenefits;
}

export class StoreMarketingService {
    async getActiveForStore(storeId: string, executor: DbTransaction = db) {
        const now = new Date();
        const rows = await executor
            .select({
                subscription: storeMarketingSubscriptions,
                plan: storeMarketingPlans,
            })
            .from(storeMarketingSubscriptions)
            .innerJoin(
                storeMarketingPlans,
                eq(storeMarketingSubscriptions.planId, storeMarketingPlans.id)
            )
            .where(
                and(
                    eq(storeMarketingSubscriptions.storeId, storeId),
                    eq(storeMarketingSubscriptions.status, "ACTIVE"),
                    gt(storeMarketingSubscriptions.endAt, now)
                )
            )
            .orderBy(desc(storeMarketingSubscriptions.endAt))
            .limit(1);
        const row = rows[0];
        if (!row?.plan?.isActive) return null;
        return row;
    }

    async listActivePlans() {
        return db
            .select()
            .from(storeMarketingPlans)
            .where(eq(storeMarketingPlans.isActive, true));
    }

    async subscribeStore(storeId: string, planId: string, paymentToken: string) {
        const active = await this.getActiveForStore(storeId);
        if (active) throw new ValidationError("Store already has an active shop tier");
        return this.activateAfterPayment(storeId, planId, paymentToken || "manual_dev");
    }

    async activateAfterPayment(storeId: string, planId: string, paymentToken: string) {
        const [plan] = await db
            .select()
            .from(storeMarketingPlans)
            .where(
                and(eq(storeMarketingPlans.id, planId), eq(storeMarketingPlans.isActive, true))
            );
        if (!plan) throw new NotFoundError("Marketing plan not found");

        const active = await this.getActiveForStore(storeId);
        if (active) throw new ValidationError("Store already has an active shop tier");

        const subId = generateId();
        const now = new Date();
        const endAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await db.insert(storeMarketingSubscriptions).values({
            id: subId,
            storeId,
            planId,
            status: "ACTIVE",
            startAt: now,
            endAt,
            autoRenew: false,
            paymentTokenRef: paymentToken,
            updatedAt: now,
        });

        return { id: subId, status: "ACTIVE" as const, endAt };
    }
}

export const storeMarketingService = new StoreMarketingService();
