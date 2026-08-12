import { db } from "@/db";
import { escrow, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId, ValidationError } from "@/utils";
import { ledgerService } from "./ledger.service";
import { splitGrossByCommissionPercent } from "./commission.util";
import { markOrderPaymentSettled, type OrderPaymentMethod } from "./order-payment.util";

export class EscrowService {
    // 1. Hold Funds (Generic)
    private async createHold(
        params: {
            orderId: string,
            amount: string,
            tenantId: string,
            source: "COD" | "ONLINE",
            paymentId?: string,
            deliveryTaskId?: string
        },
        tx: any = db
    ) {
        // Idempotency Check: Don't hold twice for safe order
        const [existing] = await tx.select().from(escrow).where(eq(escrow.orderId, params.orderId));
        if (existing) return existing.id; // Already held

        // Accounts
        const escrowAccount = await ledgerService.ensureAccount("LIABILITY:ESCROW_HOLD", "LIABILITY", undefined, undefined, tx);
        let sourceAccount;

        if (params.source === "COD") {
            sourceAccount = await ledgerService.ensureAccount("ASSET:CASH_ON_HAND", "ASSET", undefined, undefined, tx);
        } else {
            sourceAccount = await ledgerService.ensureAccount("ASSET:PG_SETTLEMENT", "ASSET", undefined, undefined, tx);
        }

        // Ledger Entry
        const journalId = await ledgerService.postJournal(
            "ESCROW_HOLD",
            params.orderId,
            [
                { accountId: sourceAccount.id, type: "DEBIT", amount: Number(params.amount), description: `Hold: Order ${params.orderId}` },
                { accountId: escrowAccount.id, type: "CREDIT", amount: Number(params.amount), description: `Escrow Liability: Order ${params.orderId}` }
            ],
            `ESCROW_HOLD:${params.orderId}`,
            tx
        );

        // Create Record
        const id = generateId();
        await tx.insert(escrow).values({
            id,
            orderId: params.orderId,
            paymentId: params.paymentId || null,
            tenantId: params.tenantId,
            amount: params.amount,
            status: "HELD",
            ledgerJournalId: journalId,
        });

        return id;
    }

    // Public Helpers
    async holdViaCOD(orderId: string, amount: string, tenantId: string, deliveryTaskId: string, tx: any = db) {
        return this.createHold({ orderId, amount, tenantId, source: "COD", deliveryTaskId }, tx);
    }

    async holdViaPrepaid(orderId: string, amount: string, tenantId: string, paymentId: string, tx: any = db) {
        return this.createHold({ orderId, amount, tenantId, source: "ONLINE", paymentId }, tx);
    }

    /**
     * Run after the order is delivered (or COD cash is confirmed).
     * - Prepaid: expects escrow HELD from `holdViaPrepaid`, then releases (splits commission).
     * - COD: creates escrow hold (cash in hand) when missing, then releases.
     */
    async settleAfterDelivery(
        orderId: string,
        meta: { codCollected?: boolean },
        tx: any = db
    ): Promise<void> {
        const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (!order) return;

        const [escrowRow] = await tx.select().from(escrow).where(eq(escrow.orderId, orderId)).limit(1);

        if (order.paymentMethod === "COD") {
            if (!meta.codCollected) {
                throw new ValidationError("COD orders require payment confirmation (codCollected) before settlement");
            }
            if (!escrowRow) {
                await this.holdViaCOD(orderId, String(order.totalAmount), order.storeId, "DELIVERY_CONFIRMED", tx);
            } else if (escrowRow.status !== "HELD") {
                return;
            }
        } else {
            if (!escrowRow || escrowRow.status !== "HELD") {
                return;
            }
        }

        await this.releaseEscrow(orderId, tx);

        if (order.paymentMethod === "COD") {
            await markOrderPaymentSettled(
                orderId,
                order.paymentMethod as OrderPaymentMethod,
                tx
            );
        }
    }

    // 2. Release Funds (Settlement Trigger)
    async releaseEscrow(orderId: string, tx: any = db) {
        const [escrowRecord] = await tx.select().from(escrow).where(eq(escrow.orderId, orderId));
        if (!escrowRecord) return; // Should audit this? Or maybe it wasn't held?
        if (escrowRecord.status !== "HELD") return; // Idempotent

        const [orderRow] = await tx
            .select({ commissionRateSnapshot: orders.commissionRateSnapshot })
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        // Accounts
        const escrowAccount = await ledgerService.ensureAccount("LIABILITY:ESCROW_HOLD", "LIABILITY", undefined, undefined, tx);

        // Dynamic Tenant Account (Liability to Seller)
        const sellerAccountName = `LIABILITY:SELLER:${escrowRecord.tenantId}`;
        const sellerAccount = await ledgerService.ensureAccount(sellerAccountName, "LIABILITY", escrowRecord.tenantId!, undefined, tx);

        const gross = Number(escrowRecord.amount);
        const { commission, net } = splitGrossByCommissionPercent(
            gross,
            orderRow?.commissionRateSnapshot ?? undefined
        );

        const commissionAccount = await ledgerService.ensureAccount("REVENUE:PLATFORM_FEES", "REVENUE", undefined, undefined, tx);

        // Ledger Entry
        const journalId = await ledgerService.postJournal(
            "ESCROW_RELEASE",
            orderId,
            [
                { accountId: escrowAccount.id, type: "DEBIT", amount: gross, description: `Release: Order ${orderId}` },
                { accountId: sellerAccount.id, type: "CREDIT", amount: net, description: `Payout: Order ${orderId}` },
                { accountId: commissionAccount.id, type: "CREDIT", amount: commission, description: `Commission: Order ${orderId}` }
            ],
            `ESCROW_RELEASE:${orderId}`,
            tx
        );

        // Update Record
        await tx.update(escrow)
            .set({
                status: "RELEASED",
                releasedAt: new Date(),
                updatedAt: new Date(),
                ledgerJournalId: journalId
            })
            .where(eq(escrow.id, escrowRecord.id));
    }

    // 3. Reversal (Cancellation)
    async reverseEscrow(orderId: string, tx: any = db) {
        const [escrowRecord] = await tx.select().from(escrow).where(eq(escrow.orderId, orderId));
        if (!escrowRecord || escrowRecord.status !== "HELD") return;

        const escrowAccount = await ledgerService.ensureAccount("LIABILITY:ESCROW_HOLD", "LIABILITY", undefined, undefined, tx);
        // We need to know source to reverse to.
        // For MVP, if paymentId exists -> Refund Payable. If COD -> Cash (unlikely for cancel unless partial).
        // Simplification: Credit CUSTOMER_REFUND_PAYABLE
        const refundAccount = await ledgerService.ensureAccount("LIABILITY:REFUND_PAYABLE", "LIABILITY", undefined, undefined, tx);

        await ledgerService.postJournal(
            "ESCROW_REVERSAL",
            orderId,
            [
                { accountId: escrowAccount.id, type: "DEBIT", amount: Number(escrowRecord.amount), description: `Reversal: Order ${orderId}` },
                { accountId: refundAccount.id, type: "CREDIT", amount: Number(escrowRecord.amount), description: `Refund Due: Order ${orderId}` }
            ],
            `ESCROW_REVERSAL:${orderId}`,
            tx
        );

        await tx.update(escrow)
            .set({ status: "REFUNDED", updatedAt: new Date() })
            .where(eq(escrow.id, escrowRecord.id));
    }
}

export const escrowService = new EscrowService();
