import { describe, expect, it, beforeAll } from "bun:test";
import { productService } from "@/modules/seller/product/product.service"; // Fixed import
import { policyService } from "@/modules/policy/policy.service";
import { db } from "@/db";
import { policyViolations, categories, orders, users, stores, addresses } from "@/db/schema";
import { generateId } from "@/utils";
import { eq, desc } from "drizzle-orm"; // Fixed import

describe("Policy Enforcement Layer", () => {
    let storeId: string;
    let userId: string;
    let categoryId: string;
    let addressId: string;

    beforeAll(async () => {
        storeId = "store_pol_" + generateId();
        userId = "user_pol_" + generateId();
        categoryId = "cat_pol_" + generateId();
        const ownerId = "owner_pol_" + generateId();
        addressId = "addr_pol_" + generateId();

        // Seed Users
        await db.insert(users).values([
            {
                id: ownerId,
                name: "Policy Store Owner",
                email: "polowner_" + generateId() + "@test.com",
                role: "SELLER",
                phone: "98" + generateId().substring(0, 8)
            },
            {
                id: userId,
                name: "Policy Customer",
                email: "polcust_" + generateId() + "@test.com",
                role: "CUSTOMER",
                phone: "98" + generateId().substring(0, 8)
            }
        ] as any);

        // Seed Store
        await db.insert(stores).values({
            id: storeId,
            ownerId: ownerId,
            name: "Policy Store",
            slug: storeId,
            status: "ACTIVE"
        } as any);

        // Seed Address
        await db.insert(addresses).values({
            id: addressId,
            userId: userId,
            addressLine: "Test St",
            city: "Kathmandu",
            country: "Nepal",
            type: "HOME",
            label: "Home",
            latitude: 27.7,
            longitude: 85.3
        } as any);

        // Setup Category
        await db.insert(categories).values({
            id: categoryId,
            name: "Test Category",
            slug: categoryId
        } as any);
    });

    it("should block prohibited product creation", async () => {
        try {
            await productService.createProduct(storeId, userId, {
                categoryId,
                name: "Super Handgun 3000",
                basePrice: 100,
                stock: 10
            });
            expect(true).toBe(false); // Should not reach here
        } catch (e: any) {
            expect(e.message).toContain("Policy Violation");
            expect(e.message).toContain("prohibited item");
        }

        // Verify Violation Log
        const [log] = await db.select().from(policyViolations)
            .where(eq(policyViolations.actorId, userId))
            .orderBy(desc(policyViolations.createdAt))
            .limit(1);

        expect(log).toBeDefined();
        expect(log.reason).toContain("prohibited");
    });

    it("should block excessive COD orders", async () => {
        // 1. Manually insert 3 active COD orders for this user
        for (let i = 0; i < 3; i++) {
            await db.insert(orders).values({
                id: generateId(),
                userId,
                storeId,
                status: "PLACED",
                paymentMethod: "COD",
                paymentStatus: "PENDING",
                totalAmount: "100",
                deliveryAddressId: addressId
            } as any);
        }

        // 2. Try to place 4th via Policy Service directly (to avoid full order service setup overhead in this specific test)
        const check = await policyService.evaluate({
            type: "ORDER",
            data: { paymentMethod: "COD" },
            actorId: userId
        });

        expect(check.allowed).toBe(false);
        expect(check.reason).toContain("Too many active COD orders");
    });
});
