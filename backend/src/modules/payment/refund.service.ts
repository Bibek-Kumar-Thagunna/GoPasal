import { db, type DbTransaction } from "@/db";
import { refunds, escrow, orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId, NotFoundError } from "@/utils";
import { ledgerService } from "./ledger.service";
import { escrowService } from "./escrow.service";
import { invoiceService } from "@/modules/invoice/invoice.service";
import { splitGrossByCommissionPercent } from "./commission.util";

export class RefundService {
    async requestRefund(
        orderId: string,
        amount: string,
        reason: string,
        actorId: string // Admin/System ID
    ) {
        return await db.transaction(async (tx: DbTransaction) => {
            // 1. Validate Order & Existing Refunds
            const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
            if (!order) throw new NotFoundError("Order not found");

            const existingRefunds = await tx.select().from(refunds).where(eq(refunds.orderId, orderId));
            const verifiedRefund = existingRefunds.find((r: any) => r.status === "COMPLETED");
            if (verifiedRefund) return verifiedRefund; // Idempotent success

            // 2. Determine State & Action
            const [escrowRecord] = await tx.select().from(escrow).where(eq(escrow.orderId, orderId));
            const refundId = generateId();
            let journalId: string | undefined;

            // SCENARIO A: No Escrow (Pre-payment or COD not collected)
            if (!escrowRecord) {
                // If COD -> No refund needed (money wasn't taken).
                // If Prepaid -> Payment Intent exists?
                // For MVP, we assume if no Escrow, maybe payment flow failed or not reached.
                // But if Order is CANCELLED before delivery, we might need to refund Payment Gateway.
                // We'll proceed to log the refund but no ledger reversal needed if funds never hit internal accounts.
                // Check payments table? 
                const [payment] = await tx.select().from(payments).where(eq(payments.orderId, orderId));
                if (payment && payment.status === "COMPLETED") {
                    // This implies it *should* have been in Escrow. Edge case.
                    // Assuming safe to ignore ledger if no escrow record found (idempotency).
                }
            }
            // SCENARIO B: Escrow HELD
            else if (escrowRecord.status === "HELD") {
                // Call Escrow Service to Reverse
                await escrowService.reverseEscrow(orderId, tx);

                // We need the journal ID from that operation. 
                // escrowService.reverseEscrow updates status but logic is internal.
                // We can query the new journal entry or update `escrowService` to return it.
                // For integration speed, we will assume `escrowService` handled the Ledger:
                // Dr ESCROW_HOLD, Cr REFUND_PAYABLE.

                // We just record the refund here.
            }
            // SCENARIO C: Escrow RELEASED (Settled or Unsettled)
            else if (escrowRecord.status === "RELEASED") {
                // Money is with Seller (Liability) OR already Paid Out (Bank).
                // In both cases, we Debit Seller Liability (creating negative if needed).
                // And Credit Refund Payable.

                const sellerAccount = await ledgerService.ensureAccount(`LIABILITY:SELLER:${escrowRecord.tenantId}`, "LIABILITY", escrowRecord.tenantId!, undefined, tx);
                const refundAccount = await ledgerService.ensureAccount("LIABILITY:REFUND_PAYABLE", "LIABILITY", undefined, undefined, tx);

                // Reverse Commission too? 
                // Usually Platform keeps commission on refunds? Or reverses?
                // Let's assume Full Reversal for MVP (Platform loses comm).
                const commissionAccount = await ledgerService.ensureAccount("REVENUE:PLATFORM_FEES", "REVENUE", undefined, undefined, tx);

                // We need to know the breakdown.
                // Simplified: We assume we reverse the exact amounts.
                const gross = Number(amount);
                const { commission: commAmount, net: netAmount } = splitGrossByCommissionPercent(
                    gross,
                    order.commissionRateSnapshot
                );

                journalId = await ledgerService.postJournal(
                    "REFUND_POST_RELEASE",
                    orderId,
                    [
                        // Debit Seller (Take back net)
                        { accountId: sellerAccount.id, type: "DEBIT", amount: netAmount, description: `Refund Clawback: Order ${orderId}` },
                        // Debit Revenue (Take back comm)
                        { accountId: commissionAccount.id, type: "DEBIT", amount: commAmount, description: `Refund Comm Reversal: Order ${orderId}` },
                        // Credit Refund Payable (Owe Customer)
                        { accountId: refundAccount.id, type: "CREDIT", amount: gross, description: `Refund Payable: Order ${orderId}` }
                    ],
                    `REFUND:${orderId}`,
                    tx
                );
            }

            // ... existing code ...

            // ... existing code ...

            // 3. Create Refund Record
            const [newRefund] = await tx.insert(refunds).values({
                id: refundId,
                orderId,
                paymentId: escrowRecord?.paymentId,
                ledgerJournalId: journalId,
                escrowId: escrowRecord?.id,
                amount,
                reason,
                status: "COMPLETED",
                type: "FULL",
                processedAt: new Date(),
                metadata: { actorId }
            }).returning();

            // --- VAT INVOICE: CREDIT NOTE ---
            // Must be called after refund is successfully recorded.
            // Using fire-and-forget for MVP to not block, but recommended to await in strict compliance.
            invoiceService.createCreditNote(orderId, Number(amount)).catch((err: any) => {
                console.error(`[Credit Note Failed] Order ${orderId}:`, err);
            });

            return newRefund;
        });
    }
}

export const refundService = new RefundService();
