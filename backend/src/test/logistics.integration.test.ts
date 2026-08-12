import { describe, expect, it, beforeAll } from "bun:test";
import { walletService } from "@/modules/logistics/wallet.service";
import { deliveryService } from "@/modules/delivery/delivery.service";
import { db } from "@/db";
import { riders, users, deliveryTasks, orders, stores, addresses } from "@/db/schema";
import { generateId } from "@/utils";
import { eq } from "drizzle-orm";

describe("Intelligent Logistics", () => {
    let riderId: string;
    let userId: string;
    let taskId: string;

    beforeAll(async () => {
        userId = "user_log_" + generateId();
        riderId = "rider_log_" + generateId();
        const storeId = "store_log_" + generateId();
        const ownerId = "owner_log_" + generateId();
        const customerId = "cust_log_" + generateId();
        const addressId = "addr_log_" + generateId();

        // Seed Store Owner
        await db.insert(users).values({
            id: ownerId,
            name: "Logistics Store Owner",
            email: "logowner_" + generateId() + "@test.com",
            role: "SELLER",
            phone: "98" + generateId().substring(0, 8)
        } as any);

        // Seed Customer
        await db.insert(users).values({
            id: customerId,
            name: "Logistics Customer",
            email: "logcust_" + generateId() + "@test.com",
            role: "CUSTOMER",
            phone: "98" + generateId().substring(0, 8)
        } as any);

        // Seed Store
        await db.insert(stores).values({
            id: storeId,
            ownerId: ownerId,
            name: "Logistics Store",
            slug: storeId,
            status: "ACTIVE"
        } as any);

        // Seed Address
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

        // Mock User & Rider
        await db.insert(users).values({
            id: userId,
            name: "Rider Log",
            email: "rider_" + generateId() + "@test.com",
            role: "RIDER",
            phone: "98" + generateId().substring(0, 8) // Unique phone
        } as any);

        await db.insert(riders).values({
            id: riderId,
            userId,
            vehicleType: "bike",
            licensePlate: "BA 1 PA 1111",
            status: "ONLINE",
            maxWalletLimit: "1000", // Low limit for test
            codCashInHand: "900" // Almost full
        });

        // Create Task
        taskId = generateId();
        const orderId = generateId();
        await db.insert(orders).values({
            id: orderId,
            storeId: storeId,
            userId: customerId,
            deliveryAddressId: addressId,
            totalAmount: "200",
            paymentMethod: "COD",
            paymentStatus: "PENDING"
        } as any);
        await db.insert(deliveryTasks).values({ id: taskId, orderId, codAmount: "200", status: "PENDING" });
    });

    it("should block task acceptance if wallet limit exceeded", async () => {
        // 900 + 200 = 1100 > 1000
        try {
            await deliveryService.acceptTask(userId, taskId);
            expect(true).toBe(false); // Should fail
        } catch (e: any) {
            expect(e.message).toContain("Wallet Limit Exceeded");
        }
    });

    it("should unlock after deposit", async () => {
        // Deposit 500
        const depositId = await walletService.recordDeposit(riderId, 500);
        await walletService.verifyDeposit(depositId, "admin_1");

        // Balance should be 900 - 500 = 400.
        // 400 + 200 = 600 < 1000. Should pass.
        await deliveryService.acceptTask(userId, taskId);

        const [task] = await db.select().from(deliveryTasks).where(eq(deliveryTasks.id, taskId));
        expect(task.status).toBe("ASSIGNED");
    });
});
