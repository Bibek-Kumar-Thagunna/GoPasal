
import { describe, expect, it, beforeAll, spyOn } from "bun:test";
import { db } from "@/db";
import { users, stores, products, productVariants, addresses, categories, inventory } from "@/db/schema"; // Added addresses & categories
import { generateId } from "@/utils";
import { eq } from "drizzle-orm";

import { authService } from "@/modules/auth/auth.service";
import { catalogService } from "@/modules/catalog/catalog.service";
import { cartService } from "@/modules/cart/cart.service";
import { orderService } from "@/modules/order/order.service";
import { deliveryService } from "@/modules/delivery/delivery.service";
import { analyticsService } from "@/modules/analytics/analytics.service";
import { otps } from "@/db/schema";
import { hashPassword } from "@/utils";

describe("GoPasal End-to-End User Journey", () => {

    // Test State
    let userId: string;
    let storeId: string;
    let productId: string;
    let variantId: string;
    let orderId: string;
    let addressId: string; // Removed duplicate declaration
    const userEmail = `e2e_${generateId()} @test.com`;
    // Use random phone to avoid unique constraint violations
    const userPhone = "+977" + Math.floor(9000000000 + Math.random() * 1000000000).toString();

    beforeAll(async () => {
        // Seed Category
        await db.insert(categories).values({
            id: "cat_misc",
            name: "Miscellaneous",
            slug: "misc-" + generateId(),
            isActive: true
        } as any).onConflictDoNothing();

        // Seed Store & Product
        storeId = "store_e2e_" + generateId();
        // Seed Owner
        const ownerId = "owner_" + generateId();
        await db.insert(users).values({
            id: ownerId,
            email: `owner_${generateId()}@test.com`,
            phone: "+977" + Math.floor(9000000000 + Math.random() * 1000000000).toString(),
            role: "SELLER",
            fullName: "E2E Owner"
        } as any);

        await db.insert(stores).values({
            id: storeId,
            ownerId: ownerId,
            name: "E2E Super Store",
            slug: storeId,
            status: "ACTIVE",
            commissionRate: "5.00",
            latitude: 27.7172,
            longitude: 85.3240,
            deliveryRadius: 10
        } as any);

        productId = "prod_e2e_" + generateId();
        variantId = "var_e2e_" + generateId();

        await db.insert(products).values({
            id: productId,
            storeId,
            name: "E2E Test Product",
            slug: "e2e-prod-" + generateId(),
            basePrice: "500",
            isActive: true,
            categoryId: "cat_misc"
        } as any);

        await db.insert(productVariants).values({
            id: variantId,
            productId,
            name: "Standard Variant",
            sku: "SKU-" + generateId(),
            priceOffset: "0",
            attributes: {}
        } as any);

        // Seed Inventory
        await db.insert(inventory).values({
            id: "inv_" + generateId(),
            variantId,
            quantity: 100,
            lowStockThreshold: 10
        } as any);

        // Seed Customer User
        userId = "user_cust_" + generateId();
        await db.insert(users).values({
            id: userId,
            email: userEmail,
            phone: userPhone,
            role: "CUSTOMER",
            fullName: "E2E Customer"
        } as any);

        // Seed Address
        addressId = "addr_" + generateId();
        await db.insert(addresses).values({
            id: addressId,
            userId,
            label: "Home",
            addressLine: "123 Test St",
            city: "Kathmandu",
            state: "Bagmati",
            country: "Nepal",
            phone: userPhone,
            latitude: "27.7172", // String or number depending on schema, likely string/decimal
            longitude: "85.3240"
        } as any);
    });

    // 1. Auth: Register & Login (OTP Flow)
    it("Step 1: Customer Authentication", async () => {
        console.log("DEBUG: Running Step 1 Auth");
        // The SMS provider is an external dependency; stub delivery so the
        // journey is hermetic in CI (the OTP is read from the DB below).
        const sms = await import("@/integrations/sms.service");
        spyOn(sms, "deliverOtpSms").mockResolvedValue({ success: true } as never);

        // Send OTP
        await authService.sendOTP(userPhone);
        console.log("DEBUG: OTP Sent to", userPhone);

        // Get OTP record from DB
        const otpRecord = await db.query.otps.findFirst({
            where: (t, { eq }) => eq(t.phone, userPhone),
            orderBy: (t, { desc }) => [desc(t.createdAt)]
        });
        console.log("DEBUG: OTP Record found:", otpRecord?.id);
        expect(otpRecord).toBeDefined();

        // Manually set known OTP hash to bypass random generation
        const testOtp = "123456";
        const testOtpHash = await hashPassword(testOtp);
        await db.update(otps).set({ otpHash: testOtpHash }).where(eq(otps.id, otpRecord!.id));
        console.log("DEBUG: OTP Hash updated");

        // Verify OTP (Registers or Logins)
        const res = await authService.verifyOTP(userPhone, testOtp);
        console.log("DEBUG: verifyOTP result user:", res.user.id);

        // Should match seeded userId
        expect(res.user.id).toBe(userId);
        expect(res.tokens.accessToken).toBeDefined();

        // Debug: Verify Address Exists
        const addrCheck = await db.select().from(addresses).where(eq(addresses.id, addressId));
        console.log("DEBUG: Step 1 Address Check:", addrCheck.length > 0 ? "FOUND" : "NOT FOUND");
    });

    // 2. Discovery: Search & View
    it("Step 2: Catalog Discovery", async () => {
        const results = await catalogService.searchProducts({ query: "E2E" });
        expect(results.data.length).toBeGreaterThan(0);
        expect(results.data.find(p => p.id === productId)).toBeDefined();
    });

    // 3. Cart: Add Item
    // 3. Cart: Add Item
    it("Step 3: Add to Cart", async () => {
        const res = await cartService.addItem(userId, variantId, 2);
        expect(res).toBeDefined();
        if (!res) throw new Error("Cart not returned");

        expect(res.items.length).toBeGreaterThan(0);
        expect(res.items[0].variantId).toBe(variantId);

        // Check for cartId in the returned Cart object (it returns the Cart, not { cartId })
        expect(res.id).toBeDefined();

        // Verify Cart Total
        const cart = await cartService.getCart(userId);
        expect(cart).toBeDefined();
        if (!cart) throw new Error("Cart fetch failed");

        expect(cart.items.length).toBe(1);
        expect(cart.items[0].quantity).toBe(2);
    });

    // 4. Order: Place Order
    it("Step 4: Place Order", async () => {
        console.log("DEBUG: Step 4 - Checking Address:", addressId);
        const addrCheck = await db.select().from(addresses).where(eq(addresses.id, addressId));
        console.log("DEBUG: Address Found:", addrCheck.length > 0 ? "YES" : "NO");
        if (addrCheck.length > 0) {
            console.log("DEBUG: Address details:", addrCheck[0]);
            console.log("DEBUG: Address UserId:", addrCheck[0].userId, "Test UserId:", userId);
        }

        const orderRes = await orderService.placeOrder(userId, {
            paymentMethod: "COD",
            deliveryAddressId: addressId
        });
        expect(orderRes.order.id).toBeDefined();
        orderId = orderRes.order.id;

        // Verify Order Status
        const order = await orderService.getOrder(userId, orderId);
        expect(order.status).toBe("PLACED");
    });

    // 5. Seller Fulfillment (Mocked via Service)
    it("Step 5: Seller Fulfillment", async () => {
        // Assign Rider
        const taskId = await deliveryService.createTaskForOrder(orderId);
        expect(taskId).toBeDefined();
    });

    // 6. Analytics
    it("Step 6: Verify Analytics", async () => {
        // Run aggregation
        await analyticsService.computeDailyMetrics(new Date());

        // Fetch
        const data = await analyticsService.getDashboardData(new Date(), new Date(), "gross_revenue");
        expect(data.length).toBeGreaterThanOrEqual(1);
    });
});

