import { db, type DbTransaction } from "@/db";
import { disputes, disputeMessages, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId, NotFoundError, ForbiddenError } from "@/utils";
import { createAuditLog } from "@/shared";
import { refundService } from "@/modules/payment/refund.service";
import { escrowService } from "@/modules/payment/escrow.service";

export class DisputeService {
    async createDispute(orderId: string, reporterId: string, reason: string) {
        // Validate Order Exists
        const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
        if (!order) throw new NotFoundError("Order not found");

        const id = generateId();
        const [dispute] = await db
            .insert(disputes)
            .values({
                id,
                orderId,
                reporterId,
                reason,
                status: "OPEN",
                priority: "MEDIUM"
            })
            .returning();

        await createAuditLog({
            actorId: reporterId,
            action: "CREATE_DISPUTE",
            resource: "disputes",
            resourceId: id,
            afterState: dispute,
        });

        // Add initial system message or note? Optional.
        return dispute;
    }

    async addMessage(
        disputeId: string,
        senderId: string,
        senderRole: string,
        message: string,
        isInternal = false
    ) {
        const [dispute] = await db.select().from(disputes).where(eq(disputes.id, disputeId));
        if (!dispute) throw new NotFoundError("Dispute not found");

        const messageId = generateId();
        const [msg] = await db.insert(disputeMessages).values({
            id: messageId,
            disputeId,
            senderId,
            senderRole,
            message,
            isInternal
        }).returning();

        // Audit strictly for messages? Maybe too noisy. 
        // We'll skip audit for chat messages unless it's a sensitive action.

        return msg;
    }

    async listDisputes(status?: "OPEN" | "RESOLVED" | "REJECTED") {
        let query = db.select().from(disputes);
        if (status) {
            query = query.where(eq(disputes.status, status)) as any;
        }
        return await query.orderBy(desc(disputes.createdAt));
    }

    async resolveDispute(
        disputeId: string,
        adminId: string,
        resolution: {
            action: "REFUND" | "RELEASE" | "REJECT";
            refundAmount?: string;
            notes?: string;
        }
    ) {
        return await db.transaction(async (tx: DbTransaction) => {
            const [dispute] = await tx.select().from(disputes).where(eq(disputes.id, disputeId));
            if (!dispute) throw new NotFoundError("Dispute not found");
            if (dispute.status !== "OPEN") throw new ForbiddenError("Dispute is not open");

            // FINANCIAL ACTIONS
            if (resolution.action === "REFUND") {
                if (!resolution.refundAmount) throw new ForbiddenError("Refund amount required");
                // Trigger Refund via RefundService (which handles Ledger)
                // Note: We pass 'adminId' as the actor
                await refundService.requestRefund(
                    dispute.orderId,
                    resolution.refundAmount,
                    `Dispute Resolution: ${disputeId}`,
                    adminId
                );
            } else if (resolution.action === "RELEASE") {
                // Seller Wins -> Release Escrow
                await escrowService.releaseEscrow(dispute.orderId, tx);
            }

            // Update Dispute Status
            const status = resolution.action === "REJECT" ? "REJECTED" : "RESOLVED";

            const [updated] = await tx
                .update(disputes)
                .set({
                    status,
                    resolution: resolution,
                    resolvedBy: adminId,
                    resolvedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(disputes.id, disputeId))
                .returning();

            // Audit
            await createAuditLog({
                actorId: adminId,
                action: "RESOLVE_DISPUTE",
                resource: "disputes",
                resourceId: disputeId,
                beforeState: { status: dispute.status },
                afterState: { status, resolution },
            }, tx); // Pass transaction

            return updated;
        });
    }

    async getDisputeMessages(disputeId: string) {
        return await db.select().from(disputeMessages)
            .where(eq(disputeMessages.disputeId, disputeId))
            .orderBy(disputeMessages.createdAt);
    }
}

export const disputeService = new DisputeService();
