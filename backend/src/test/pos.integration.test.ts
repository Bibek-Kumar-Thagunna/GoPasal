import { describe, expect, it, beforeAll } from "bun:test";
import { posService } from "@/modules/pos/pos.service";
import { db } from "@/db";
import { stores, products, productVariants, inventory, posIntegrations, posProductMappings, orders, orderItems, posOrderMappings, users, categories, addresses } from "@/db/schema";
import { generateId } from "@/utils";
import { eq } from "drizzle-orm";

describe("POS Integration", () => {
    let storeId: string;
    let productId: string;
    let variantId: string;
    let orderId: string;

    beforeAll(async () => {
        storeId = "store_pos_" + generateId();
        productId = "prod_pos_" + generateId();
        variantId = "var_pos_" + generateId();
        const ownerId = "owner_pos_" + generateId();
        const customerId = "cust_pos_" + generateId();
        const categoryId = "cat_pos_" + generateId();
        const addressId = "addr_pos_" + generateId();

        // Seed Users
        await db.insert(users).values([
            {
                id: ownerId,
                name: "POS Store Owner",
                email: "posowner_" + generateId() + "@test.com",
                role: "SELLER",
                phone: "98" + generateId().substring(0, 8)
            },
            {
                id: customerId,
                name: "POS Customer",
                email: "poscust_" + generateId() + "@test.com",
                role: "CUSTOMER",
                phone: "98" + generateId().substring(0, 8)
            }
        ] as any);

        // Seed Category
        await db.insert(categories).values({
            id: categoryId,
            name: "POS Category",
            slug: categoryId
        } as any);

        // Seed Address
        await db.insert(addresses).values({
            id: addressId,
            userId: customerId,
            addressLine: "POS Test St",
            city: "Kathmandu",
            country: "Nepal",
            type: "HOME",
            label: "Home",
            latitude: 27.7,
            longitude: 85.3
        } as any);

        // Setup Store
        await db.insert(stores).values({
            id: storeId,
            ownerId: ownerId,
            name: "POS Store",
            slug: storeId,
            status: "ACTIVE"
        } as any);

        // Setup Product & Inventory
        // Initial: Price 100, Stock 10
        await db.insert(products).values({
            id: productId,
            storeId: storeId,
            name: "POS Item",
            basePrice: "100",
            categoryId: categoryId,
            slug: productId
        } as any);
        await db.insert(productVariants).values({ id: variantId, productId: productId, name: "Standard" } as any);
        await db.insert(inventory).values({ id: generateId(), variantId, quantity: 10 });

        // Setup POS Integration
        await db.insert(posIntegrations).values({
            id: generateId(),
            storeId,
            provider: "IMS", // Mock adapter
            config: "{}",
            status: "ACTIVE"
        });

        // Setup Mapping
        // Map to "EXT-123" which Mock Adapter returns with Price 150, Stock 50
        await db.insert(posProductMappings).values({
            id: generateId(),
            storeId,
            productId,
            variantId,
            externalProductId: "EXT-123"
        });

        // Store orderId for later test
        orderId = generateId();
        await db.insert(orders).values({
            id: orderId,
            storeId,
            userId: customerId,
            deliveryAddressId: addressId,
            totalAmount: "150",
            paymentStatus: "PENDING"
        } as any);
        await db.insert(orderItems).values({
            id: generateId(),
            orderId,
            variantId,
            quantity: 1,
            productName: "POS Item",
            priceAtPurchase: "150"
        });
    });

    it("should update price and stock on Menu Sync", async () => {
        await posService.syncMenu(storeId);

        const [prod] = await db.select().from(products).where(eq(products.id, productId));
        const [inv] = await db.select().from(inventory).where(eq(inventory.variantId, variantId));

        expect(Number(prod.basePrice)).toBe(150); // Updated from 100
        expect(inv.quantity).toBe(50); // Updated from 10
    });

    it("should push order and record mapping", async () => {
        await posService.pushOrderToPos(orderId);

        const [mapping] = await db.select().from(posOrderMappings).where(eq(posOrderMappings.orderId, orderId));
        expect(mapping).toBeDefined();
        expect(mapping.syncStatus).toBe("SYNCED");
        expect(mapping.externalOrderId).toBe(`IMS-${orderId}`);
    });
});
