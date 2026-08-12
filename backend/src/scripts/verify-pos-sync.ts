
import { db } from "@/db";
import {  products, stores, masterProductTemplates, branchProductLinks, users, masterMerchants, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/utils";
import { EnterpriseProductService } from "@/modules/enterprise/enterprise-product.service";

async function runTest() {
    console.log("--- Starting POS Sync ↔ Enterprise Verification ---");

    // 0. Seed Dependencies (User, Master Merchant, Category)
    await db.insert(categories).values({
        id: "cat_burgers",
        name: "Burgers",
        slug: "burgers-" + generateId(),
        isActive: true
    } as any).onConflictDoNothing().catch(err => console.log("Category setup skipped/failed", err));

    const ownerId = "staff_1";
    await db.insert(users).values({
        id: ownerId,
        email: "staff1@example.com",
        phone: "+9779800000001",
        role: "SELLER",
        fullName: "Staff One"
    } as any).onConflictDoNothing().catch(err => console.log("User setup skipped/failed", err));

    const masterId = "test-master";
    await db.insert(masterMerchants).values({
        id: masterId,
        name: "Test Master Merchant",
        ownerId: ownerId, // Link to the user we just created
        currency: "NPR",
        status: "ACTIVE"
    } as any).onConflictDoNothing().catch(err => console.log("Master Merchant setup skipped/failed", err));

    // 1. Setup Master Merchant & Branch
    // ...

    // Create a Master Template
    const templateId = generateId();
    await db.insert(masterProductTemplates).values({
        id: templateId,
        masterMerchantId: "test-master",
        name: "Master Burger",
        basePrice: "100",
        description: "Original Recipe",
        categoryId: "cat_burgers", // Added
        isActive: true
    }).catch(err => console.log("Template setup skipped/failed", err));

    // Create a Branch Store
    const branchStoreId = "store_" + generateId();
    await db.insert(stores).values({
        id: branchStoreId,
        ownerId: "staff_1", // mock
        name: "Branch 1",
        status: "ACTIVE",
        masterMerchantId: "test-master",
        createdAt: new Date(),
        updatedAt: new Date(),
        slug: "branch-1-" + generateId(),
        operatingHours: {}, // Added
        kycStatus: "APPROVED", // Added
        address: "Test Address", // Added
        latitude: 27.7,
        longitude: 85.3,
        deliveryRadius: 5000
    } as any).catch(err => console.log("Store setup skipped/error", err));

    // Update Master Merchant with Branch ID
    await db.update(masterMerchants)
        .set({ branchIds: [branchStoreId] })
        .where(eq(masterMerchants.id, "test-master"));

    // Link Template to Branch Product
    const productId = "prod_" + generateId();
    await db.insert(products).values({
        id: productId,
        storeId: branchStoreId,
        categoryId: "cat_burgers", // Added
        name: "Master Burger (Branch)",
        basePrice: "100",
        status: "PUBLISHED",
        slug: "prod-slug-" + generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
    } as any);

    await db.insert(branchProductLinks).values({
        branchStoreId,
        productId: productId, // Correct field name
        templateId: templateId,
        isLocalOverride: false
    });

    console.log("✅ Setup Complete");

    // 2. Simulate Master Push (Price Update)
    const service = new EnterpriseProductService();
    console.log("🔄 Executing Master Push (Price 100 -> 120)...");

    // Simulate logic manually if service doesn't have direct test method
    // In real flow: Master updates Template -> Event -> Service updates Links
    await db.update(masterProductTemplates).set({ basePrice: "120" }).where(eq(masterProductTemplates.id, templateId));
    await service.pushTemplateToBranches("test-master", templateId);

    // Verify
    const [updatedProduct] = await db.select().from(products).where(eq(products.id, productId));
    if (updatedProduct.basePrice === "120.00") {
        console.log("✅ Master Push Successful: Price updated to 120");
    } else {
        console.error("❌ Master Push Failed: Price is ", updatedProduct.basePrice);
    }

    // 3. Simulate Local Override Attempt (Without Permission)
    console.log("🔄 Executing Local POS Update (Price 120 -> 150)...");
    // POS usually calls ProductService.update
    await db.update(products).set({ basePrice: "150" }).where(eq(products.id, productId));

    // BUT Sync should revert it if strictly enforced? 
    // Actually, "Sync" happens on Master Update. If Branch updates locally, it might persist UNTIL next sync, 
    // OR blocked. Requirement says "HQ Push overwrites Branch local changes unless override allowed".
    // So if we run Sync again, it should revert to 120.

    await service.pushTemplateToBranches("test-master", templateId);

    const [revertedProduct] = await db.select().from(products).where(eq(products.id, productId));
    if (revertedProduct.basePrice === "120.00") {
        console.log("✅ Policy Verified: Sync reverted unauthorized local change.");
    } else {
        console.error("❌ Policy Fail: Local change persisted after sync.");
    }

    // 4. Simulate Local Override (With Permission)
    console.log("🔄 Executing Authorized Local Override...");
    await db.update(branchProductLinks).set({ isLocalOverride: true }).where(eq(branchProductLinks.productId, productId));
    await db.update(products).set({ basePrice: "150" }).where(eq(products.id, productId)); // Local change

    // Master changes to 130
    await db.update(masterProductTemplates).set({ basePrice: "120" }).where(eq(masterProductTemplates.id, templateId));

    // Debug: Check if update persisted
    const [debugTmpl] = await db.select().from(masterProductTemplates).where(eq(masterProductTemplates.id, templateId));
    console.log("DEBUG: Template Price in DB after update:", debugTmpl.basePrice);

    await service.pushTemplateToBranches("test-master", templateId);

    const [overrideProduct] = await db.select().from(products).where(eq(products.id, productId));
    if (overrideProduct.basePrice === "150.00") {
        console.log("✅ Policy Verified: Local override respected. Price kept at 150.");
    } else {
        console.error("❌ Policy Fail: Override overwritten by sync. Price: ", overrideProduct.basePrice);
    }

    console.log("--- Test Complete ---");
}

runTest().catch(console.error);
