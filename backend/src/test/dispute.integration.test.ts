import { describe, expect, it, beforeAll } from "bun:test";
import { disputeService } from "@/modules/support/dispute.service";
import { db } from "@/db";
import { disputes, orders, stores, users, addresses } from "@/db/schema";
import { generateId } from "@/utils";
import { eq } from "drizzle-orm";

describe("Dispute System", () => {
    let orderId: string;
    let reporterId: string;
    let adminId: string;
    let disputeId: string;

    beforeAll(async () => {
        orderId = "ord_disp_" + generateId();
        reporterId = "user_rep_" + generateId();
        adminId = "admin_disp_" + generateId();
        const ownerId = "owner_disp_" + generateId();
        const storeId = "store_disp_" + generateId();

        // 0. Seed Dependencies
        await db.insert(users).values({
            id: ownerId,
            name: "Dispute Owner",
            email: "dispute_owner_" + generateId() + "@test.com",
            role: "SELLER",
            phone: "98" + generateId().substring(0, 8)
        } as any);

        await db.insert(users).values({
            id: reporterId,
            name: "Dispute Reporter",
            email: "reporter_" + generateId() + "@test.com",
            role: "CUSTOMER",
            phone: "98" + generateId().substring(0, 8)
        } as any);

        await db.insert(users).values({
            id: adminId,
            name: "Dispute Admin",
            email: "admin_" + generateId() + "@test.com",
            role: "ADMIN",
            phone: "98" + generateId().substring(0, 8)
        } as any);

        await db.insert(stores).values({ id: storeId, name: "Dispute Store", status: "ACTIVE", ownerId: ownerId, slug: "dispute-store-" + generateId() } as any);

        // Seed Address
        const addressId = "addr_disp_" + generateId();
        await db.insert(addresses).values({
            id: addressId,
            userId: reporterId,
            addressLine: "Test St",
            city: "Kathmandu",
            country: "Nepal",
            type: "HOME",
            label: "Home",
            latitude: 27.7,
            longitude: 85.3
        } as any);

        // Create Dummy Order
        await db.insert(orders).values({
            id: orderId,
            userId: reporterId, // Mapping customerId to userId
            storeId: storeId,
            totalAmount: "100.00",
            status: "DELIVERED",
            paymentStatus: "PENDING",
            deliveryAddressId: addressId,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);
    });

    it("should create a dispute", async () => {
        const dispute = await disputeService.createDispute(orderId, reporterId, "Item missing");
        disputeId = dispute.id;
        expect(dispute).toBeDefined();
        expect(dispute.status).toBe("OPEN");
    });

    it("should add messages", async () => {
        await disputeService.addMessage(disputeId, reporterId, "CUSTOMER", "Where is my item?");
        const msgs = await disputeService.getDisputeMessages(disputeId);
        expect(msgs.length).toBe(1);
        expect(msgs[0].message).toBe("Where is my item?");
    });

    it("should resolve dispute with REFUND action", async () => {
        // Mock RefundService if possible, or integration test relies on it failing gracefully or working.
        // Since order doesn't have escrow, RefundService might fail if we don't mock it or setup escrow.
        // For this test, we care that `resolveDispute` calls `refundService`.
        // We will catch error if RefundService complains about "Order not found" or "Escrow missing", 
        // effectively proving it TRIED to call it.

        // Actually, we created the order in DB, so it exists. 
        // But Escrow might not exist. `RefundService` handles "No Escrow" logic (See Prompt 15).

        await disputeService.resolveDispute(disputeId, adminId, {
            action: "REFUND",
            refundAmount: "50.00",
            notes: "Partial refund granted"
        });

        const [disp] = await db.select().from(disputes).where(eq(disputes.id, disputeId));
        expect(disp.status).toBe("RESOLVED");
        expect((disp.resolution as any).action).toBe("REFUND");
        expect(disp.resolvedBy).toBe(adminId);
    });
});
