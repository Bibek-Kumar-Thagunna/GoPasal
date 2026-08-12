import { db, type DbTransaction } from "@/db";
import { payments, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId, NotFoundError } from "@/utils";
import { escrowService } from "./escrow.service";
import { createAuditLog } from "@/shared";
import { markOrderPrepaid } from "./order-payment.util";

export class PaymentService {
    async createPaymentIntent(
        orderId: string,
        method: "COD" | "ESEWA" | "KHALTI",
        amount: number,
        idempotencyKey?: string,
        userId?: string
    ) {
        // Check idempotency
        if (idempotencyKey) {
            const [existing] = await db.select().from(payments).where(eq(payments.idempotencyKey, idempotencyKey));
            if (existing) return existing;
        }

        const paymentId = generateId();
        const [payment] = await db.insert(payments).values({
            id: paymentId,
            orderId,
            method,
            amount: String(amount),
            status: "PENDING",
            idempotencyKey,
        }).returning();

        if (userId) {
            await createAuditLog({
                actorId: userId, action: "CREATE_PAYMENT", resource: "payments", resourceId: paymentId, metadata: { amount, method }
            });
        }

        return payment;
    }

    async confirmPayment(paymentId: string, gatewayRef: string) {
        return await db.transaction(async (tx: DbTransaction) => {
            const [payment] = await tx.select().from(payments).where(eq(payments.id, paymentId));
            if (!payment) throw new NotFoundError("Payment not found");
            if (payment.status === "COMPLETED") return payment;

            const [updated] = await tx.update(payments)
                .set({ status: "COMPLETED", gatewayRef, updatedAt: new Date() })
                .where(eq(payments.id, paymentId))
                .returning();

            // Move to Escrow
            // We need tenantId (storeId) from Order to hold correctly
            const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId));

            if (order) {
                await escrowService.holdViaPrepaid(
                    payment.orderId,
                    payment.amount,
                    order.storeId,
                    paymentId,
                    tx
                );
                await markOrderPrepaid(payment.orderId, tx);
            }

            return updated;
        });
    }

    /**
     * Mark a pending payment as failed/expired (reconciliation path).
     * Safe to call multiple times; never touches completed payments.
     */
    async failPayment(paymentId: string, reason: string) {
        return await db.transaction(async (tx: DbTransaction) => {
            const [payment] = await tx.select().from(payments).where(eq(payments.id, paymentId));
            if (!payment) throw new NotFoundError("Payment not found");
            if (payment.status !== "PENDING") return payment;

            const [updated] = await tx
                .update(payments)
                .set({ status: "FAILED", metadata: { ...((payment.metadata ?? {}) as object), failureReason: reason }, updatedAt: new Date() })
                .where(eq(payments.id, paymentId))
                .returning();

            await createAuditLog({
                actorId: "SYSTEM",
                action: "FAIL_PAYMENT",
                resource: "payments",
                resourceId: paymentId,
                metadata: { reason },
            });

            return updated;
        });
    }
}

export const paymentService = new PaymentService();
