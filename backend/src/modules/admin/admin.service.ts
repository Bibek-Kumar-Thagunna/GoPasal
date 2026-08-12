import { db } from "@/db";
import { stores, settlements, webhookEvents, codRecords } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NotFoundError, ValidationError } from "@/utils";
import { createAuditLog } from "@/shared";
import { refundService } from "@/modules/payment/refund.service";
import { settlementService } from "@/modules/payment/settlement.service";
import {
    buildStoreApprovedUpdate,
    buildStoreRejectedUpdate,
    buildStoreSuspendedUpdate,
    isStoreOnboardingComplete,
    mergeStoreMetadata,
} from "./store-governance.util";

export class AdminService {
    async approveSeller(storeId: string, adminId: string) {
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
        if (!store) throw new NotFoundError("Store not found");

        if (store.verificationStep === "APPROVED" && store.status === "ACTIVE") {
            return { success: true, storeId, alreadyApproved: true };
        }

        const update = buildStoreApprovedUpdate();
        await db.update(stores).set(update).where(eq(stores.id, storeId));

        await createAuditLog({
            actorId: adminId,
            actorRole: "ADMIN",
            action: "APPROVE_SELLER",
            resource: "stores",
            resourceId: storeId,
            beforeState: {
                status: store.status,
                verificationStep: store.verificationStep,
            },
            afterState: update,
        });

        return { success: true, storeId };
    }

    async rejectSeller(storeId: string, reason: string, adminId: string) {
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
        if (!store) throw new NotFoundError("Store not found");

        const trimmed = reason.trim();
        if (trimmed.length < 3) {
            throw new ValidationError("Rejection reason must be at least 3 characters");
        }

        const update = buildStoreRejectedUpdate(trimmed);
        await db.update(stores).set(update).where(eq(stores.id, storeId));

        await createAuditLog({
            actorId: adminId,
            actorRole: "ADMIN",
            action: "REJECT_SELLER",
            resource: "stores",
            resourceId: storeId,
            metadata: { reason: trimmed },
            beforeState: {
                status: store.status,
                verificationStep: store.verificationStep,
            },
            afterState: update,
        });

        return { success: true, storeId };
    }

    async suspendSeller(storeId: string, reason: string, adminId: string) {
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
        if (!store) throw new NotFoundError("Store not found");

        const update = buildStoreSuspendedUpdate();
        await db.update(stores).set(update).where(eq(stores.id, storeId));

        await createAuditLog({
            actorId: adminId,
            actorRole: "ADMIN",
            action: "SUSPEND_SELLER",
            resource: "stores",
            resourceId: storeId,
            metadata: { reason },
            beforeState: { status: store.status },
            afterState: update,
        });

        return { success: true, storeId };
    }

    async resendSellerToSetup(storeId: string, adminId: string) {
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
        if (!store) throw new NotFoundError("Store not found");

        if (store.verificationStep !== "APPROVED" && store.status !== "ACTIVE") {
            throw new ValidationError(
                "Only approved/active shops can be sent back to setup"
            );
        }

        const metadata = mergeStoreMetadata(store.metadata, {
            onboardingCompletedAt: null,
            onboardingResentAt: new Date().toISOString(),
        });

        await db
            .update(stores)
            .set({
                updatedAt: new Date(),
                metadata,
            })
            .where(eq(stores.id, storeId));

        await createAuditLog({
            actorId: adminId,
            actorRole: "ADMIN",
            action: "RESEND_SELLER_SETUP",
            resource: "stores",
            resourceId: storeId,
            beforeState: {
                onboardingComplete: isStoreOnboardingComplete(store.metadata),
            },
            afterState: { onboardingComplete: false },
        });

        return { success: true, storeId };
    }

    async triggerRefund(orderId: string, amount: string, reason: string, adminId: string) {
        const refund = await refundService.requestRefund(orderId, amount, reason, adminId);

        await createAuditLog({
            actorId: adminId,
            actorRole: "ADMIN",
            action: "TRIGGER_REFUND",
            resource: "refunds",
            resourceId: refund.id,
            metadata: { orderId, amount, reason },
        });

        return refund;
    }

    async triggerSettlement(storeId: string, start: Date, end: Date, adminId: string) {
        const settlementId = await settlementService.generateSettlement(storeId, start, end);

        if (settlementId) {
            await createAuditLog({
                actorId: adminId,
                actorRole: "ADMIN",
                action: "TRIGGER_SETTLEMENT",
                resource: "settlements",
                resourceId: settlementId,
                metadata: { storeId, periodStart: start, periodEnd: end },
            });
        }

        return {
            settlementId,
            message: settlementId ? "Settlement Cycle Created" : "No funds to settle",
        };
    }

    async executePayout(settlementId: string, transactionRef: string, adminId: string) {
        const settlement = await settlementService.executePayout(settlementId, transactionRef);

        await createAuditLog({
            actorId: adminId,
            actorRole: "SUPER_ADMIN",
            action: "EXECUTE_PAYOUT",
            resource: "settlements",
            resourceId: settlementId,
            metadata: { transactionRef, amount: settlement.netAmount },
        });

        return settlement;
    }

    async listSettlements(page = 1, limit = 20, storeId?: string) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(50, Math.max(1, limit));
        const offset = (safePage - 1) * safeLimit;

        const where = storeId ? eq(settlements.storeId, storeId) : undefined;

        const rows = await db
            .select({
                settlement: settlements,
                store: {
                    id: stores.id,
                    name: stores.name,
                    slug: stores.slug,
                },
            })
            .from(settlements)
            .leftJoin(stores, eq(settlements.storeId, stores.id))
            .where(where)
            .orderBy(desc(settlements.createdAt))
            .limit(safeLimit)
            .offset(offset);

        const items = rows.map((row) => ({
            ...row.settlement,
            store: row.store?.id ? row.store : null,
        }));

        const [countRow] = await db
            .select({ total: sql<number>`count(*)::int`.mapWith(Number) })
            .from(settlements)
            .where(storeId ? eq(settlements.storeId, storeId) : undefined);

        return {
            items,
            total: countRow?.total ?? 0,
            page: safePage,
            limit: safeLimit,
        };
    }

    async listWebhookEvents(page = 1, limit = 25, status?: string) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const offset = (safePage - 1) * safeLimit;

        const where = status
            ? eq(webhookEvents.status, status as "RECEIVED" | "PROCESSED" | "FAILED")
            : undefined;

        const rows = await db
            .select()
            .from(webhookEvents)
            .where(where)
            .orderBy(desc(webhookEvents.createdAt))
            .limit(safeLimit)
            .offset(offset);

        const [countRow] = await db
            .select({ total: sql<number>`count(*)::int`.mapWith(Number) })
            .from(webhookEvents)
            .where(where);

        return {
            items: rows,
            total: countRow?.total ?? 0,
            page: safePage,
            limit: safeLimit,
        };
    }

    async listCodRecords(page = 1, limit = 25) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const offset = (safePage - 1) * safeLimit;

        const rows = await db
            .select()
            .from(codRecords)
            .orderBy(desc(codRecords.createdAt))
            .limit(safeLimit)
            .offset(offset);

        const [countRow] = await db
            .select({ total: sql<number>`count(*)::int`.mapWith(Number) })
            .from(codRecords);

        return {
            items: rows,
            total: countRow?.total ?? 0,
            page: safePage,
            limit: safeLimit,
        };
    }
}

export const adminService = new AdminService();
