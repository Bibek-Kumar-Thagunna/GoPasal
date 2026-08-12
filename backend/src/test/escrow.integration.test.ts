import { describe, expect, it, beforeAll } from "bun:test";
import { escrowService } from "@/modules/payment/escrow.service";
import { ledgerService } from "@/modules/payment/ledger.service";
import { db } from "@/db";
import { escrow, orders, stores, users, payments, addresses } from "@/db/schema";
import { generateId } from "@/utils";
import { eq } from "drizzle-orm";

describe("Escrow Service (Hold/Release)", () => {
    let orderId: string;
    let tenantId: string;
    let paymentId: string;

    beforeAll(async () => {
        const userId = "user_escrow_" + generateId();
        const customerId = "cust_escrow_" + generateId();
        tenantId = "store_test_escrow_" + generateId();
        orderId = "ord_escrow_" + generateId();
        paymentId = "pay_escrow_" + generateId();

        // 1. Seed Users
        await db.insert(users).values([
            { id: userId, name: "Escrow Owner", email: "escrow_owner_" + generateId() + "@test.com", role: "SELLER", phone: "98" + generateId().substring(0, 8) },
            { id: customerId, name: "Escrow Cust", email: "escrow_cust_" + generateId() + "@test.com", role: "CUSTOMER", phone: "98" + generateId().substring(0, 8) }
        ] as any);

        // 2. Seed Store
        await db.insert(stores).values({ id: tenantId, name: "Escrow Store", status: "ACTIVE", ownerId: userId, slug: "escrow-store-" + generateId() } as any);

        // 3. Seed Address
        const addressId = "addr_escrow_" + generateId();
        await db.insert(addresses).values({
            id: addressId,
            userId: customerId,
            addressLine: "Test St",
            city: "Kathmandu",
            country: "Nepal",
            type: "HOME",
            label: "Home",
            latitude: 27.7,
            longitude: 85.3
        } as any);

        // 4. Seed Order
        await db.insert(orders).values({
            id: orderId,
            storeId: tenantId,
            userId: customerId,
            totalAmount: "1000.00",
            status: "DELIVERED",
            paymentStatus: "PENDING",
            deliveryAddressId: addressId,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);

        // 5. Seed Payment
        await db.insert(payments).values({
            id: paymentId,
            orderId,
            amount: "1000.00",
            method: "ESEWA",
            status: "COMPLETED",
            transactionId: "tx_" + generateId(),
            createdAt: new Date()
        } as any);
    });

    it("should hold funds via Prepaid (Online)", async () => {
        // 1. Hold
        const escrowId = await escrowService.holdViaPrepaid(orderId, "1000.00", tenantId, paymentId);
        expect(escrowId).toBeDefined();

        // 2. Verify Record (HELD)
        const [record] = await db.select().from(escrow).where(eq(escrow.id, escrowId));
        expect(record.status).toBe("HELD");
        expect(record.amount).toBe("1000.00");

        // 3. Verify Ledger (Dr Asset / Cr Liability)
        const escrowLiability = await ledgerService.ensureAccount("LIABILITY:ESCROW_HOLD", "LIABILITY");
        const balance = await ledgerService.getAccountBalance(escrowLiability.id);
        expect(balance.credits).toBeGreaterThanOrEqual(1000);
    });

    it("should be idempotent on Hold", async () => {
        // Call again
        const duplicateId = await escrowService.holdViaPrepaid(orderId, "1000.00", tenantId, paymentId);
        // Should return same record without error
        const [record] = await db.select().from(escrow).where(eq(escrow.id, duplicateId));
        expect(record.status).toBe("HELD");
    });

    it("should release funds on Delivery", async () => {
        // 1. Release
        await escrowService.releaseEscrow(orderId);

        // 2. Verify Record (RELEASED)
        const [record] = await db.select().from(escrow).where(eq(escrow.orderId, orderId));
        expect(record.status).toBe("RELEASED");

        // 3. Verify Ledger (Dr Liability / Cr Seller + Revenue)
        // Seller Account
        const sellerAccount = await ledgerService.ensureAccount(`LIABILITY:SELLER:${tenantId}`, "LIABILITY", tenantId);
        const sellerBalance = await ledgerService.getAccountBalance(sellerAccount.id);

        // 1000 * 0.9 = 900
        expect(sellerBalance.credits).toBe(900);

        // Platform Revenue
        const revenueAccount = await ledgerService.ensureAccount("REVENUE:PLATFORM_FEES", "REVENUE");
        const revBalance = await ledgerService.getAccountBalance(revenueAccount.id);
        expect(revBalance.credits).toBeGreaterThanOrEqual(100);
    });

    it("should fail gracefully (idempotent) on double release", async () => {
        await escrowService.releaseEscrow(orderId);
        // Should not throw, just existing state
        const [record] = await db.select().from(escrow).where(eq(escrow.orderId, orderId));
        expect(record.status).toBe("RELEASED");
    });
});
