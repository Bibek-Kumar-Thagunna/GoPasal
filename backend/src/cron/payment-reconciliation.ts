import { Cron } from "croner";
import { db } from "@/db";
import { payments, paymentAttempts, orders } from "@/db/schema";
import { eq, and, lt, isNull } from "drizzle-orm";
import { logger } from "@/shared/logger";
import { paymentService } from "@/modules/payment/payment.service";
import {
    khaltiLookupPayment,
    isKhaltiPaymentCompleted,
} from "@/modules/payment/gateways/khalti.gateway";
import {
    verifyEsewaTransactionStatus,
    isEsewaPaymentComplete,
} from "@/modules/payment/gateways/esewa.gateway";

/**
 * Payment reconciliation job.
 *
 * Runs every 5 minutes and resolves online payments stuck in PENDING:
 * - If the gateway reports the payment as completed → confirm it (escrow hold,
 *   order marked prepaid) — this covers customers who paid but never returned
 *   to the app (missed return-URL / webhook).
 * - If the gateway reports a terminal non-completed state, or the payment is
 *   older than `PAYMENT_STALE_AFTER_MS` with no movement → mark it FAILED so
 *   the customer can retry from the order page instead of being stuck forever.
 *
 * Guards:
 * - Only touches payments whose payment record is still PENDING.
 * - Requires gateway credentials; when a provider isn't configured the job
 *   logs and skips that provider (fail-safe, never throws the whole job).
 */
const STALE_AFTER_MS = 30 * 60 * 1000; // 30 minutes

async function reconcileKhaltiPayment(payment: {
    id: string;
    orderId: string;
    metadata: unknown;
}) {
    const meta = (payment.metadata ?? {}) as { pidx?: string } | null;
    const pidx = meta?.pidx;
    if (!pidx) return;

    try {
        const lookup = await khaltiLookupPayment(pidx);
        if (isKhaltiPaymentCompleted(lookup.status)) {
            await paymentService.confirmPayment(payment.id, `reconcile-khalti-${lookup.transactionId ?? pidx}`);
            logger.info({ paymentId: payment.id, orderId: payment.orderId }, "payment.reconciled.paid.khalti");
        } else if (["REFUNDED", "EXPIRED", "CANCELLED", "PARTIALLY_REFUNDED"].includes(lookup.status.toUpperCase())) {
            await paymentService.failPayment(payment.id, `Gateway status: ${lookup.status}`);
            logger.info({ paymentId: payment.id, orderId: payment.orderId, status: lookup.status }, "payment.reconciled.failed.khalti");
        }
    } catch (err) {
        logger.error({ paymentId: payment.id, err: String(err) }, "payment.reconcile.khalti.error");
    }
}

async function reconcileEsewaPayment(payment: {
    id: string;
    orderId: string;
    metadata: unknown;
}) {
    const meta = (payment.metadata ?? {}) as { transactionUuid?: string; totalAmount?: string } | null;
    const txUuid = meta?.transactionUuid;
    if (!txUuid) return;

    try {
        const totalAmount = meta?.totalAmount ?? "0";
        const statusCheck = await verifyEsewaTransactionStatus(txUuid, totalAmount);
        if (isEsewaPaymentComplete(statusCheck.status)) {
            await paymentService.confirmPayment(payment.id, `reconcile-esewa-${statusCheck.refId ?? txUuid}`);
            logger.info({ paymentId: payment.id, orderId: payment.orderId }, "payment.reconciled.paid.esewa");
        }
    } catch (err) {
        logger.error({ paymentId: payment.id, err: String(err) }, "payment.reconcile.esewa.error");
    }
}

async function reconcileStalePending() {
    const cutoff = new Date(Date.now() - STALE_AFTER_MS);

    const stale = await db
        .select({
            id: payments.id,
            orderId: payments.orderId,
            method: payments.method,
            metadata: payments.metadata,
            createdAt: payments.createdAt,
        })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .where(
            and(
                eq(payments.status, "PENDING"),
                eq(orders.paymentStatus, "PENDING"),
                lt(payments.createdAt, cutoff),
                isNull(payments.gatewayRef)
            )
        )
        .limit(100);

    if (stale.length === 0) return;

    logger.info({ count: stale.length }, "payment.reconcile.found.stale");

    for (const payment of stale) {
        if (payment.method === "KHALTI") {
            await reconcileKhaltiPayment(payment as never);
        } else if (payment.method === "ESEWA") {
            await reconcileEsewaPayment(payment as never);
        } else {
            // Non-online (e.g. COD placeholder) — nothing to reconcile.
            continue;
        }
    }
}

/** Expire abandoned payment *attempts* (initiated but never paid). */
async function expireAbandonedAttempts() {
    const cutoff = new Date(Date.now() - STALE_AFTER_MS);
    const result = await db
        .update(paymentAttempts)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(
            and(
                eq(paymentAttempts.status, "INITIATED"),
                lt(paymentAttempts.createdAt, cutoff)
            )
        )
        .returning({ id: paymentAttempts.id });

    if (result.length > 0) {
        logger.info({ count: result.length }, "payment.reconcile.expired.attempts");
    }
}

export const paymentReconciliationJob = new Cron("*/5 * * * *", async () => {
    try {
        await reconcileStalePending();
        await expireAbandonedAttempts();
    } catch (err) {
        logger.error({ err: String(err) }, "payment.reconciliation.job.error");
    }
});
