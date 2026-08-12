import { db } from "@/db";
import { escrow, settlements, orders } from "@/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { ledgerService } from "./ledger.service";

export class SellerWalletService {
    async getBalances(storeId: string) {
        const sellerAccount = await ledgerService.ensureAccount(
            `LIABILITY:SELLER:${storeId}`,
            "LIABILITY",
            storeId
        );

        const [held] = await db
            .select({
                total: sql<string>`coalesce(sum(${escrow.amount}), 0)`,
            })
            .from(escrow)
            .where(and(eq(escrow.tenantId, storeId), eq(escrow.status, "HELD")));

        const [releasedUnsettled] = await db
            .select({
                total: sql<string>`coalesce(sum(${escrow.amount}), 0)`,
            })
            .from(escrow)
            .where(
                and(
                    eq(escrow.tenantId, storeId),
                    eq(escrow.status, "RELEASED"),
                    isNull(escrow.settlementId)
                )
            );

        const [pendingSettlement] = await db
            .select({
                total: sql<string>`coalesce(sum(${settlements.netAmount}), 0)`,
            })
            .from(settlements)
            .where(
                and(eq(settlements.storeId, storeId), eq(settlements.status, "PENDING"))
            );

        const [completedPayouts] = await db
            .select({
                total: sql<string>`coalesce(sum(${settlements.netAmount}), 0)`,
            })
            .from(settlements)
            .where(
                and(eq(settlements.storeId, storeId), eq(settlements.status, "COMPLETED"))
            );

        const [deliveredGmv] = await db
            .select({
                total: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
            })
            .from(orders)
            .where(and(eq(orders.storeId, storeId), eq(orders.status, "DELIVERED")));

        return {
            availableBalance: sellerAccount.balance ?? "0",
            escrowHeld: held?.total ?? "0",
            pendingRelease: releasedUnsettled?.total ?? "0",
            pendingSettlement: pendingSettlement?.total ?? "0",
            withdrawnTotal: completedPayouts?.total ?? "0",
            deliveredGmv: deliveredGmv?.total ?? "0",
            currency: "NPR",
        };
    }

    async listPayoutHistory(storeId: string, limit = 20) {
        return db
            .select()
            .from(settlements)
            .where(eq(settlements.storeId, storeId))
            .orderBy(sql`${settlements.createdAt} desc`)
            .limit(limit);
    }
}

export const sellerWalletService = new SellerWalletService();
