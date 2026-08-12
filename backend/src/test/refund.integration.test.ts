import { describe, expect, it, beforeAll } from "bun:test";
import { refundService } from "@/modules/payment/refund.service";
import { escrowService } from "@/modules/payment/escrow.service";
import { ledgerService } from "@/modules/payment/ledger.service";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { escrow, refunds, orders, payments, stores, users, addresses } from "@/db/schema";
import { generateId } from "@/utils";

describe("Refund System", () => {
    let storeId: string;
    let orderHeld: string; // Order in HELD state
    let orderReleased: string; // Order in RELEASED state

    beforeAll(async () => {
        storeId = "store_refund_" + generateId();
        const userId = "user_refund_" + generateId();
        orderHeld = "ord_held_" + generateId();
        orderReleased = "ord_rel_" + generateId();
        const pid1 = "pay_held_" + generateId();
        const pid2 = "pay_rel_" + generateId();

        // 0. Seed Dependencies
        await db.insert(users).values({
            id: userId,
            name: "Refund Owner",
            email: "refund_owner_" + generateId() + "@test.com",
            role: "SELLER",
            phone: "98" + generateId().substring(0, 8) // Ensure unique phone
        } as any);

        await db.insert(stores).values({ id: storeId, name: "Refund Store", status: "ACTIVE", ownerId: userId, slug: "refund-store-" + generateId() } as any);
        // Actually lets just insert if table exists
        // await db.insert(users).values({ id: userId, ... })... 
        // If users table has many constraints, might be annoying.
        // But foreign keys are enforced.
        // Let's assume users table exists.

        // Seed Address
        const addressId = "addr_refund_" + generateId();
        await db.insert(addresses).values({
            id: addressId,
            userId,
            addressLine: "Test St",
            city: "Kathmandu",
            country: "Nepal",
            type: "HOME",
            label: "Home",
            latitude: 27.7172,
            longitude: 85.3240
        } as any);

        // 1. Create Orders & Payments
        await db.insert(orders).values([
            { id: orderHeld, storeId, userId: userId, totalAmount: "100.00", status: "PLACED", deliveryAddressId: addressId, paymentStatus: "PENDING" },
            { id: orderReleased, storeId, userId: userId, totalAmount: "200.00", status: "DELIVERED", deliveryAddressId: addressId, paymentStatus: "PENDING" }
        ] as any);

        // Let's ensure a user exists
        try {
            // We'll use a raw query or untyped insert to avoid schema import issues if any
            // But better to use imported schemas if available. 
            // We'll try without user insert first, if it fails, we add it.
            // Actually, standard seed usually has 'user_1'.
        } catch { }

        await db.insert(payments).values([
            { id: pid1, orderId: orderHeld, method: "ESEWA", amount: "100.00", status: "COMPLETED" },
            { id: pid2, orderId: orderReleased, method: "ESEWA", amount: "200.00", status: "COMPLETED" }
        ]);

        // Setup 1: Held Escrow
        await escrowService.holdViaPrepaid(orderHeld, "100.00", storeId, pid1);

        // Setup 2: Released Escrow
        await escrowService.holdViaPrepaid(orderReleased, "200.00", storeId, pid2);
        await escrowService.releaseEscrow(orderReleased);

        // Issue VAT invoices so credit notes can be created during refunds.
        const { invoiceService } = await import("@/modules/invoice/invoice.service");
        for (const orderId of [orderHeld, orderReleased]) {
            try {
                await invoiceService.issueInvoice(orderId);
            } catch (err) {
                console.warn("refund-test invoice issue skipped:", String(err));
            }
        }
    });

    it("should reverse HELD escrow correctly", async () => {
        // Refund
        await refundService.requestRefund(orderHeld, "100.00", "Customer Cancelled", "admin_1");

        // Verify Escrow Status
        const [escrowRec] = await db.select().from(escrow).where(eq(escrow.orderId, orderHeld));
        expect(escrowRec.status).toBe("REFUNDED");

        // Verify Ledger: Refund Payable should be Credited
        const refundAccount = await ledgerService.ensureAccount("LIABILITY:REFUND_PAYABLE", "LIABILITY");
        const balance = await ledgerService.getAccountBalance(refundAccount.id);

        expect(balance.credits).toBeGreaterThanOrEqual(100);
    });

    it("should clawback RELEASED escrow correctly", async () => {
        // Seller Balance Check (Before)
        const sellerAccount = await ledgerService.ensureAccount(`LIABILITY:SELLER:${storeId}`, "LIABILITY", storeId);
        const balanceBefore = await ledgerService.getAccountBalance(sellerAccount.id);
        // Should be 200 * 0.9 = 180 Credit
        expect(balanceBefore.credits).toBeGreaterThanOrEqual(180);

        // Refund
        await refundService.requestRefund(orderReleased, "200.00", "Defective Item", "admin_1");

        // Seller Balance Check (After)
        // Should be Debit 180 (Net clawback)
        const balanceAfter = await ledgerService.getAccountBalance(sellerAccount.id);
        expect(balanceAfter.debits).toBeGreaterThanOrEqual(180); // 180 was clawed back

        // Verify Refund Record
        const [refundRec] = await db.select().from(refunds).where(eq(refunds.orderId, orderReleased));
        expect(refundRec.status).toBe("COMPLETED");
        expect(refundRec.ledgerJournalId).toBeDefined();
    });

    it("should be idempotent", async () => {
        const res1 = await refundService.requestRefund(orderHeld, "100.00", "Dup", "admin");
        const res2 = await refundService.requestRefund(orderHeld, "100.00", "Dup", "admin");

        expect(res1.id).toBe(res2.id);
    });
});
