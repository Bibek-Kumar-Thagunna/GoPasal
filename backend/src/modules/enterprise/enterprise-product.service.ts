import { db, type DbTransaction } from "@/db";
import { masterProductTemplates, branchProductLinks, masterMerchants } from "@/db/schema/enterprise";
import { stores } from "@/db/schema/stores";
import { products, productVariants } from "@/db/schema/catalog";
import { eq, inArray } from "drizzle-orm";
import { generateId } from "@/utils";
import { NotFoundError } from "@/utils/errors";

export class EnterpriseProductService {

    async userOwnsMaster(userId: string, masterId: string): Promise<boolean> {
        const [master] = await db
            .select({ id: masterMerchants.id, ownerId: masterMerchants.ownerId, branchIds: masterMerchants.branchIds })
            .from(masterMerchants)
            .where(eq(masterMerchants.id, masterId))
            .limit(1);
        if (!master) return false;
        if (master.ownerId === userId) return true;
        return (master.branchIds ?? []).some((branchId) => {
            // A branch store's owner may act on behalf of the master.
            return branchId === userId;
        });
    }

    async createTemplate(masterId: string, data: typeof masterProductTemplates.$inferInsert) {
        const [template] = await db.insert(masterProductTemplates).values({
            ...data,
            id: `tmpl_${generateId()}`,
            masterMerchantId: masterId
        }).returning();
        return template;
    }

    async pushTemplateToBranches(masterId: string, templateId: string) {
        // 1. Fetch Template & Master
        const template = await db.query.masterProductTemplates.findFirst({
            where: eq(masterProductTemplates.id, templateId)
        });
        if (!template) throw new NotFoundError("Template not found");
        console.log("DEBUG: Template found:", template.id, "Price:", template.basePrice);

        const master = await db.query.masterMerchants.findFirst({
            where: eq(masterMerchants.id, masterId)
        });
        console.log("DEBUG: Master found:", master?.id, "BranchIDs:", master?.branchIds);
        if (!master || !master.branchIds || master.branchIds.length === 0) {
            return { message: "No branches to sync" };
        }

        const branchIds = master.branchIds; // string[]

        // 2. Fetch all Branches to get Zones (Optimization: Single Query)
        const branches = await db.query.stores.findMany({
            where: inArray(stores.id, branchIds)
        });

        // 3. Sync Logic
        // For 100 branches, we might want to batch this. For MVP phase 13, simple loop in transaction is acceptable.

        await db.transaction(async (tx: DbTransaction) => {
            for (const branch of branches) {
                // A. Check for existing link
                const existingLink = await tx.query.branchProductLinks.findFirst({
                    where: (links, { and, eq }) => and(
                        eq(links.branchStoreId, branch.id),
                        eq(links.templateId, templateId)
                    )
                });
                console.log("DEBUG: Existing Link for branch", branch.id, ":", existingLink ? "FOUND" : "NOT FOUND", "Override:", existingLink?.isLocalOverride);

                // B. Calculate Price
                // Priority: Link Override > Zone Rule > Master Base
                let finalPrice = template.basePrice;

                if (existingLink?.priceOverride) {
                    finalPrice = existingLink.priceOverride;
                } else if (branch.branchZone && template.zoneRates && template.zoneRates[branch.branchZone]) {
                    finalPrice = template.zoneRates[branch.branchZone].toString(); // Ensure string/decimal compatibility
                }

                // C. Upsert Product
                let productId = existingLink?.productId;

                if (productId) {
                    // Update existing
                    const updateData: any = {
                        name: template.name,
                        description: template.description,
                        images: template.images,
                        updatedAt: new Date()
                    };

                    // Only update price if NOT locally overridden
                    if (!existingLink?.isLocalOverride) {
                        updateData.basePrice = finalPrice;
                    }

                    await tx.update(products).set(updateData).where(eq(products.id, productId));
                } else {
                    // Create New
                    productId = `prod_${generateId()}`;
                    await tx.insert(products).values({
                        id: productId,
                        storeId: branch.id,
                        categoryId: template.categoryId,
                        name: template.name,
                        slug: `${template.name.toLowerCase().replace(/ /g, '-')}-${branch.id.slice(-4)}`, // Unique slug
                        description: template.description,
                        basePrice: finalPrice,
                        images: template.images,
                        isActive: true
                    });

                    // Create Default Variant
                    await tx.insert(productVariants).values({
                        id: `var_${generateId()}`,
                        productId: productId,
                        name: "Standard",
                        priceOffset: "0",
                        isActive: true
                    });
                }

                // D. Update/Create Link
                if (!existingLink) {
                    await tx.insert(branchProductLinks).values({
                        branchStoreId: branch.id,
                        templateId: templateId,
                        productId: productId,
                        isSynced: true
                    });
                } else {
                    await tx.update(branchProductLinks)
                        .set({ isSynced: true, updatedAt: new Date() })
                        .where(eq(branchProductLinks.productId, productId)); // simplified where
                }
            }
        });

        return { synced: branchIds.length };
    }
}
