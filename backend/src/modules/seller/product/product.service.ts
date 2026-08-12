import { db, type DbTransaction } from "@/db";
import { products, productVariants, inventory, categories } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateId, NotFoundError, ValidationError, TenantError } from "@/utils";
import { logger } from "@/utils/logger";
import { createAuditLog } from "@/shared";
import { policyService } from "@/modules/policy/policy.service"; // Import

export class ProductService {
    async createProduct(
        storeId: string,
        userId: string,
        data: {
            categoryId: string;
            name: string;
            description?: string;
            basePrice: number;
            compareAtPrice?: number | null;
            isDeliverable?: boolean;
            sku?: string;
            stock: number;
            images?: string[];
        }
    ) {
        // 1. Policy Check
        const policyCheck = await policyService.evaluate({
            type: "PRODUCT",
            data: { name: data.name, description: data.description },
            actorId: userId
        });

        if (!policyCheck.allowed) {
            throw new ValidationError(`Policy Violation: ${policyCheck.reason}`);
        }

        // Validate Category
        const [category] = await db
            .select()
            .from(categories)
            .where(eq(categories.id, data.categoryId));

        if (!category) {
            throw new NotFoundError("Category not found");
        }

        const productId = generateId();
        const variantId = generateId();
        const inventoryId = generateId();

        // Transaction
        return await db.transaction(async (tx: DbTransaction) => {
            // 1. Create Product
            const [newProduct] = await tx
                .insert(products)
                .values({
                    id: productId,
                    storeId,
                    categoryId: data.categoryId,
                    name: data.name,
                    slug: `${data.name.toLowerCase().replace(/ /g, "-")}-${Date.now()}`, // Simple slug gen
                    description: data.description,
                    basePrice: String(data.basePrice), // decimal is string in JS usually
                    compareAtPrice:
                        data.compareAtPrice === undefined || data.compareAtPrice === null
                            ? null
                            : String(data.compareAtPrice),
                    isDeliverable: data.isDeliverable !== undefined ? data.isDeliverable : true,
                    images: data.images || [],
                    isActive: true,
                })
                .returning();

            // 2. Create Default Variant (Simple Product)
            await tx.insert(productVariants).values({
                id: variantId,
                productId,
                name: "Default",
                sku: data.sku,
                priceOffset: "0",
                isActive: true,
            });

            // 3. Create Inventory
            await tx.insert(inventory).values({
                id: inventoryId,
                variantId,
                quantity: data.stock,
                lowStockThreshold: 5,
            });

            // 4. Audit
            await createAuditLog({
                actorId: userId,
                action: "CREATE",
                resource: "products",
                resourceId: productId,
                metadata: { payload: data },
            }, tx);

            return newProduct;
        });
    }

    async listMyProducts(storeId: string) {
        if (!storeId?.trim()) {
            throw new TenantError("Tenant context required");
        }
        return await db.query.products.findMany({
            where: and(
                eq(products.storeId, storeId),
                eq(products.isArchived, false)
            ),
            with: {
                variants: {
                    with: {
                        inventory: true
                    }
                },
                category: true
            },
            orderBy: desc(products.createdAt)
        });
    }

    async getProduct(storeId: string, productId: string) {
        const product = await db.query.products.findFirst({
            where: and(
                eq(products.storeId, storeId),
                eq(products.id, productId)
            ),
            with: {
                variants: {
                    with: { inventory: true }
                },
                category: true
            }
        });
        
        if (!product) throw new NotFoundError("Product not found");
        return product;
    }

    async updateProduct(
        storeId: string,
        productId: string,
        userId: string,
        data: {
            name?: string;
            description?: string;
            basePrice?: number;
            compareAtPrice?: number | null;
            isDeliverable?: boolean;
            isActive?: boolean;
            images?: string[];
            categoryId?: string;
            sku?: string;
        }
    ) {
        const [product] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.storeId, storeId)));

        if (!product) throw new NotFoundError("Product not found");

        if (data.categoryId) {
            const [category] = await db
                .select()
                .from(categories)
                .where(eq(categories.id, data.categoryId));
            if (!category) throw new NotFoundError("Category not found");
        }

        // Policy Check
        if (data.name || data.description) {
            const policyCheck = await policyService.evaluate({
                type: "PRODUCT",
                data: {
                    name: data.name || product.name,
                    description: data.description || product.description
                },
                actorId: userId
            });

            if (!policyCheck.allowed) {
                throw new ValidationError(`Policy Violation: ${policyCheck.reason}`);
            }
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.basePrice !== undefined) updateData.basePrice = String(data.basePrice);
        if (data.compareAtPrice !== undefined) {
            updateData.compareAtPrice =
                data.compareAtPrice === null ? null : String(data.compareAtPrice);
        }
        if (data.isDeliverable !== undefined) updateData.isDeliverable = data.isDeliverable;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.images !== undefined) updateData.images = data.images;
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

        const [updated] = await db
            .update(products)
            .set(updateData)
            .where(eq(products.id, productId))
            .returning();

        if (data.sku !== undefined) {
            const [variant] = await db
                .select({ id: productVariants.id })
                .from(productVariants)
                .where(eq(productVariants.productId, productId))
                .limit(1);
            if (variant) {
                await db
                    .update(productVariants)
                    .set({ sku: data.sku || null })
                    .where(eq(productVariants.id, variant.id));
            }
        }

        await createAuditLog({
            actorId: userId,
            action: "UPDATE",
            resource: "products",
            resourceId: productId,
            metadata: { changes: data },
        });

        return updated;
    }

    async deleteProduct(storeId: string, productId: string, userId: string) {
        const [product] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.storeId, storeId)));

        if (!product) throw new NotFoundError("Product not found");

        // Soft delete (archive)
        await db
            .update(products)
            .set({ isArchived: true, isActive: false, updatedAt: new Date() })
            .where(eq(products.id, productId));

        await createAuditLog({
            actorId: userId,
            action: "DELETE",
            resource: "products",
            resourceId: productId,
        });

        return { success: true };
    }
    async updateStock(storeId: string, productId: string, quantity: number, userId: string) {
        // Find default variant for this product
        const [variant] = await db
            .select({ id: productVariants.id })
            .from(productVariants)
            .innerJoin(products, eq(productVariants.productId, products.id))
            .where(and(eq(products.id, productId), eq(products.storeId, storeId)));

        if (!variant) throw new NotFoundError("Product/Variant not found");

        const [updated] = await db
            .update(inventory)
            .set({ quantity, updatedAt: new Date() })
            .where(eq(inventory.variantId, variant.id))
            .returning();

        await createAuditLog({
            actorId: userId,
            action: "UPDATE_STOCK",
            resource: "inventory",
            resourceId: updated.id,
            metadata: { productId, quantity },
        });

        logger.info("seller.inventory.stock_updated", {
            tenantId: storeId,
            actorId: userId,
            productId,
            variantId: variant.id,
            quantity,
            inventoryId: updated.id,
        });

        return updated;
    }

    // --- Variant Management ---

    async addVariant(storeId: string, productId: string, data: { name: string, priceOffset: number, sku?: string, stock: number }, userId: string) {
        // Verify product ownership
        const [product] = await db.select().from(products).where(and(eq(products.id, productId), eq(products.storeId, storeId)));
        if (!product) throw new NotFoundError("Product not found");

        const variantId = generateId();

        return await db.transaction(async (tx: DbTransaction) => {
            const [variant] = await tx.insert(productVariants).values({
                id: variantId,
                productId,
                name: data.name,
                sku: data.sku,
                priceOffset: String(data.priceOffset),
                isActive: true
            }).returning();

            await tx.insert(inventory).values({
                id: generateId(),
                variantId,
                quantity: data.stock
            });

            await createAuditLog({ actorId: userId, action: "CREATE_VARIANT", resource: "product_variants", resourceId: variantId, metadata: data }, tx);
            return variant;
        });
    }

}

export const productService = new ProductService();
