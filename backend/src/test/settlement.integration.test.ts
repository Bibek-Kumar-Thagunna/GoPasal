import { describe, expect, it, beforeAll } from "bun:test";
import { settlementService } from "@/modules/payment/settlement.service";
import { escrowService } from "@/modules/payment/escrow.service";
import { ledgerService } from "@/modules/payment/ledger.service";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { settlements, users, stores, orders, payments, addresses } from "@/db/schema";
import { generateId } from "@/utils";

describe("Settlement Engine", () => {
    let storeId: string;
    let orderId1: string;
    let orderId2: string;

    beforeAll(async () => {
        storeId = "store_settle_" + generateId();
        orderId1 = generateId();
        orderId2 = generateId();

        // Seed dependencies
        const userId = "user_settle_" + generateId();
        await db.insert(users).values({
            id: userId,
            name: "Settlement Owner",
            email: "settle_owner_" + generateId() + "@test.com",
            role: "SELLER",
            phone: "98" + generateId().substring(0, 8)
        } as any);

        await db.insert(stores).values({ id: storeId, name: "Settle Store", status: "ACTIVE", ownerId: userId, slug: "settle-store-" + generateId() } as any);

        const addressId = "addr_settle_" + generateId();
        await db.insert(addresses).values({
            id: addressId,
            userId,
            addressLine: "Test St",
            city: "Kathmandu",
            country: "Nepal",
            type: "HOME",
            label: "Home",
            latitude: 27.7,
            longitude: 85.3
        } as any);

        await db.insert(orders).values([
            { id: orderId1, storeId, userId, totalAmount: "100.00", status: "DELIVERED", paymentStatus: "PENDING", deliveryAddressId: addressId },
            { id: orderId2, storeId, userId, totalAmount: "200.00", status: "DELIVERED", paymentStatus: "PENDING", deliveryAddressId: addressId }
        ] as any);

        const paymentId = generateId();
        const paymentId2 = paymentId + "_2";

        await db.insert(payments).values([
            { id: paymentId, orderId: orderId1, method: "ESEWA", amount: "100.00", status: "COMPLETED" },
            { id: paymentId2, orderId: orderId2, method: "ESEWA", amount: "200.00", status: "COMPLETED" }
        ]);

        // Setup: Create 2 Escrow Records (HELD)
        await escrowService.holdViaPrepaid(orderId1, "100.00", storeId, paymentId);
        await escrowService.holdViaPrepaid(orderId2, "200.00", storeId, paymentId2);

        // Release them (Ready for Settlement)
        await escrowService.releaseEscrow(orderId1);
        await escrowService.releaseEscrow(orderId2);
    });

    it("should generate a settlement cycle with correct totals", async () => {
        const start = new Date(Date.now() - 100000);
        const end = new Date(Date.now() + 100000);

        const settlementId = await settlementService.generateSettlement(storeId, start, end);
        expect(settlementId).toBeDefined();

        if (!settlementId) return; // TS guard

        const [cycle] = await db.select().from(settlements).where(eq(settlements.id, settlementId));

        // Gross: 100 + 200 = 300
        expect(Number(cycle.grossAmount)).toBe(300);
        // Fee (10%): 10 + 20 = 30
        expect(Number(cycle.commissionAmount)).toBe(30);
        // Net: 270
        expect(Number(cycle.netAmount)).toBe(270);
        expect(cycle.status).toBe("PENDING");
    });

    it("should execute payout and update ledger", async () => {
        // Fetch the pending settlement from above (since we don't return ID in test scope widely, re-query or assume sequence)
        const [cycle] = await db.select().from(settlements).where(and(eq(settlements.storeId, storeId), eq(settlements.status, "PENDING")));

        const executed = await settlementService.executePayout(cycle.id, "bank_ref_001");

        expect(executed.status).toBe("COMPLETED");

        // Verify Ledger
        // Seller Liability (Debited/Decreases)
        const sellerAccount = await ledgerService.ensureAccount(`LIABILITY:SELLER:${storeId}`, "LIABILITY", storeId);
        const balance = await ledgerService.getAccountBalance(sellerAccount.id);

        // Setup was: Credit 270 (Release) -> Debit 270 (Payout) 
        // Net should be 0? 
        // Release 1: Cr 90
        // Release 2: Cr 180
        // Total Cr: 270.
        // Payout: Dr 270.
        // Balance: 0? Or checking raw Debit?

        expect(balance.debits).toBeGreaterThanOrEqual(270);
        expect(Math.abs(balance.credits - balance.debits)).toBeLessThan(1); // Near zero
    });

    it("should not double-settle items", async () => {
        const start = new Date(Date.now() - 100000);
        const end = new Date(Date.now() + 100000);

        const settlementId = await settlementService.generateSettlement(storeId, start, end);
        expect(settlementId).toBeNull(); // Already settled above
    });
});
