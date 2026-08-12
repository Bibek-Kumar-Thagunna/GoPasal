import { db, type DbTransaction } from "@/db";
import { settlements, settlementItems, escrow, orders } from "@/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { generateId, NotFoundError, ConflictError } from "@/utils";
import { ledgerService } from "./ledger.service";
import { splitGrossByCommissionPercent } from "./commission.util";

export class SettlementService {
    // 1. Calculate & Create Settlement Cycle (Draft/Pending)
    async generateSettlement(storeId: string, periodStart: Date, periodEnd: Date) {
        return await db.transaction(async (tx: DbTransaction) => {
            // Unsettled, Released Escrow items in range
            const items = await tx
                .select({
                    escrowId: escrow.id,
                    escrowOrderId: escrow.orderId,
                    escrowAmount: escrow.amount,
                    commissionRateSnapshot: orders.commissionRateSnapshot,
                })
                .from(escrow)
                .innerJoin(orders, eq(escrow.orderId, orders.id))
                .where(
                    and(
                        eq(escrow.tenantId, storeId),
                        eq(escrow.status, "RELEASED"),
                        isNull(escrow.settlementId),
                        gte(escrow.releasedAt, periodStart),
                        lte(escrow.releasedAt, periodEnd)
                    )
                );

            if (items.length === 0) return null; // Nothing to settle

            const settlementId = generateId();
            let grossTotal = 0;
            let feeTotal = 0;
            let netTotal = 0;

            const settlementItemsData = [];

            for (const row of items) {
                const amount = Number(row.escrowAmount);
                const { commission: fee, net } = splitGrossByCommissionPercent(
                    amount,
                    row.commissionRateSnapshot
                );

                grossTotal += amount;
                feeTotal += fee;
                netTotal += net;

                settlementItemsData.push({
                    id: generateId(),
                    settlementId,
                    escrowId: row.escrowId,
                    orderId: row.escrowOrderId,
                    amount: String(net),
                    fee: String(fee),
                });
            }

            // Create Cycle
            await tx.insert(settlements).values({
                id: settlementId,
                storeId,
                periodStart,
                periodEnd,
                grossAmount: String(grossTotal),
                commissionAmount: String(feeTotal),
                netAmount: String(netTotal),
                status: "PENDING",
            });

            // Create Items
            if (settlementItemsData.length > 0) {
                await tx.insert(settlementItems).values(settlementItemsData);
            }

            // Link Escrow to Settlement (Locking them)
            for (const row of items) {
                await tx.update(escrow)
                    .set({ settlementId, updatedAt: new Date() })
                    .where(eq(escrow.id, row.escrowId));
            }

            return settlementId;
        });
    }

    // 2. Execute Payout (Money Movement)
    async executePayout(settlementId: string, transactionRef: string) {
        return await db.transaction(async (tx: DbTransaction) => {
            const [settlement] = await tx.select().from(settlements).where(eq(settlements.id, settlementId));
            if (!settlement) throw new NotFoundError("Settlement not found");
            if (settlement.status === "COMPLETED") throw new ConflictError("Settlement already completed");

            // Update Status
            const [updated] = await tx.update(settlements)
                .set({ status: "COMPLETED", transactionRef, executedAt: new Date(), updatedAt: new Date() })
                .where(eq(settlements.id, settlementId))
                .returning();

            // Ledger: Debit Liability:Seller, Credit Asset:Bank
            const sellerAccount = await ledgerService.ensureAccount(`LIABILITY:SELLER:${settlement.storeId}`, "LIABILITY", settlement.storeId);
            const bankAccount = await ledgerService.ensureAccount("ASSET:PLATFORM_BANK", "ASSET");

            await ledgerService.postJournal(
                "PAYOUT",
                settlementId,
                [
                    { accountId: sellerAccount.id, type: "DEBIT", amount: Number(settlement.netAmount), description: `Payout: ${settlementId}` },
                    { accountId: bankAccount.id, type: "CREDIT", amount: Number(settlement.netAmount), description: `Bank Transfer: ${transactionRef}` }
                ],
                `PAYOUT:${settlementId}`,
                tx
            );

            return updated;
        });
    }
}

export const settlementService = new SettlementService();
