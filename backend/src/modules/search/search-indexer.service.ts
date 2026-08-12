import { searchService } from "./search.service";
import { products, stores } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export class SearchIndexerService {
    // In a real message-queue architecture, these would be consumers.
    // For MVP, we call these methods directly from Product/Store Service hooks.

    async onProductUpdated(productId: string) {
        try {
            const product = await db.query.products.findFirst({
                where: eq(products.id, productId),
                with: {
                    category: true,
                    store: true
                }
            });

            if (!product) return; // Deleted?

            // Only index active products
            if (!product.isActive || product.isArchived) {
                // TODO: Remove from index if exists
                return;
            }

            // Construct rich text for embedding
            // Title + Category + Description + Tags (Metadata)
            const metaTags = (product.metadata as any)?.tags || [];

            await searchService.indexDocument(
                product.storeId, // Tenant ID (Store Owner) - simplified
                "PRODUCT",
                product.id,
                {
                    title: product.name,
                    description: product.description || "",
                    tags: [...metaTags, product.category.name],
                    categoryId: product.categoryId,
                    price: Number(product.basePrice),
                    storeId: product.storeId
                }
            );

        } catch (err) {
            console.error(`[Search Indexer] Failed to index product ${productId}:`, err);
            // In PROD: Send to Dead Letter Queue
        }
    }

    async onStoreUpdated(storeId: string) {
        try {
            const store = await db.query.stores.findFirst({
                where: eq(stores.id, storeId)
            });

            if (!store) return;

            if (store.status !== "ACTIVE") {
                // TODO: Remove from index
                return;
            }

            await searchService.indexDocument(
                store.ownerId, // Tenant
                "STORE",
                store.id,
                {
                    title: store.name,
                    description: store.description || "",
                    tags: [store.slug],
                    storeId: store.id
                }
            );

        } catch (err) {
            console.error(`[Search Indexer] Failed to index store ${storeId}:`, err);
        }
    }
}

export const searchIndexer = new SearchIndexerService();
