import { describe, expect, it, beforeAll } from "bun:test";
import { invoiceService } from "@/modules/invoice/invoice.service";
import { db } from "@/db";
import { invoices, orders, orderItems, stores, productVariants, taxProfiles, users, addresses, products, categories } from "@/db/schema";
import { generateId } from "@/utils";
import { eq } from "drizzle-orm";

describe("VAT Engine & Invoicing", () => {
    let storeId: string;
    let orderId: string;

    beforeAll(async () => {
        storeId = "store_vat_" + generateId();
        orderId = "order_vat_" + generateId();
        const productId = "prod_vat_" + generateId();
        const variantId = "var_vat_" + generateId();

        const userId = "user_inv_" + generateId();
        const customerId = "cust_inv_" + generateId();

        // Seed Users
        await db.insert(users).values([
            {
                id: userId,
                name: "Store Owner",
                email: "owner_" + generateId() + "@test.com",
                role: "SELLER",
                phone: "98" + generateId().substring(0, 8)
            },
            {
                id: customerId,
                name: "Customer Invoice",
                email: "cust_inv_" + generateId() + "@test.com",
                role: "CUSTOMER",
                phone: "98" + generateId().substring(0, 8)
            }
        ] as any);

        // Seed Address
        const addressId = "addr_inv_" + generateId();
        await db.insert(addresses).values({
            id: addressId,
            userId: customerId,
            addressLine: "Kathmandu",
            city: "Kathmandu",
            country: "Nepal",
            type: "HOME",
            label: "Home",
            latitude: 27.7,
            longitude: 85.3
        } as any);

        // Setup Store & Tax Profile
        await db.insert(stores).values({ id: storeId, name: "VAT Store", ownerId: userId, slug: "vat-store-" + generateId(), status: "ACTIVE" } as any);
        await db.insert(taxProfiles).values({
            id: generateId(),
            storeId,
            legalName: "VAT Store Pvt Ltd",
            vatNumber: "123456789",
            address: "Kathmandu",
            isVatRegistered: true
        });

        // Seed Category
        const categoryId = "cat_vat_" + generateId();
        await db.insert(categories).values({
            id: categoryId,
            name: "Test Category",
            slug: "test-category-" + generateId(),
            storeId
        } as any);

        // Seed Product & Variant
        await db.insert(products).values({
            id: productId,
            storeId,
            categoryId,
            name: "Test Product",
            slug: "test-product-" + generateId(),
            description: "Test Desc",
            basePrice: "100",
            status: "published",
            updatedAt: new Date(),
            createdAt: new Date()
        } as any);

        await db.insert(productVariants).values({
            id: variantId,
            productId,
            name: "Test Variant",
            price: "1130",
            stock: 100,
            status: "active",
            updatedAt: new Date(),
            createdAt: new Date()
        } as any);

        // Setup Order (Total 1130 -> 1000 Goods + 130 VAT)
        await db.insert(orders).values({
            id: orderId,
            storeId,
            totalAmount: "1130",
            userId: customerId,
            deliveryAddressId: addressId,
            status: "DELIVERED",
            paymentStatus: "PENDING"
        } as any);

        // Setup Item (Price 1130 inclusive of VAT)
        await db.insert(orderItems).values({
            id: generateId(),
            orderId,
            variantId,
            productName: "Test Item",
            quantity: 1,
            priceAtPurchase: "1130"
        });
    });

    it("should generate correct draft with split VAT", async () => {
        const draft: any = await invoiceService.generateDraft(orderId);

        expect(draft.status).toBe("DRAFT");
        // 1130 Inclusive 13% VAT => Net ~1000, VAT ~130
        expect(draft.totals.subtotal).toBe(1000);
        expect(draft.totals.totalTax).toBe(130);
        expect(draft.totals.goodsVat).toBe(130);
        // No service fee in this test case
        expect(draft.totals.serviceVat).toBe(0);
    });

    it("should issue invoice and assign number", async () => {
        const issued = await invoiceService.issueInvoice(orderId);

        expect(issued.status).toBe("ISSUED");
        expect(issued.invoiceNumber).toBeString();
        expect(issued.invoiceNumber).toContain("INV-");

        const [record] = await db.select().from(invoices).where(eq(invoices.id, issued.id));
        expect(record.status).toBe("ISSUED");
    });

    it("should create credit note", async () => {
        // Stimulate refund trigger
        await invoiceService.createCreditNote(orderId, 1130);
        // Note: Logic generates new ID, let's query by orderId and type
        const cns = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
        const creditNote = cns.find(i => i.type === "CREDIT_NOTE");

        expect(creditNote).toBeDefined();
        expect(Number((creditNote as any)?.totals['totalAmount'])).toBe(-1130);
    });
});
