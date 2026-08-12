import { db } from "@/db";
import {
    stores,
    categories,
    storeCategories,
    products,
    productVariants,
    
} from "@/db/schema";
import { eq, and, ilike, sql, desc, gte, lte, isNotNull } from "drizzle-orm";
import { NotFoundError } from "@/utils/errors";
import { adService } from "@/modules/adtech/ad.service";
import { searchService } from "@/modules/search/search.service";
import {
    DEFAULT_DELIVERY_RADIUS_KM,
    PICKUP_DISCOVERY_RADIUS_KM,
} from "@/utils/geo";

export class CatalogService {
    // --- Stores ---

    async listStores(lat?: number, lon?: number, limit = 20) {
        if (lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
            const distanceExpr = sql`
        6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(${lat})) * cos(radians(${stores.latitude})) *
            cos(radians(${stores.longitude}) - radians(${lon})) +
            sin(radians(${lat})) * sin(radians(${stores.latitude}))
          ))
        )
      `;

            const serviceRadiusExpr = sql`
        CASE
          WHEN ${stores.deliveryType} = 'PICKUP_ONLY' THEN ${PICKUP_DISCOVERY_RADIUS_KM}
          ELSE COALESCE(${stores.deliveryRadius}, ${DEFAULT_DELIVERY_RADIUS_KM})
        END
      `;

            const distance = distanceExpr.as("distance");

            return db
                .select({
                    id: stores.id,
                    name: stores.name,
                    slug: stores.slug,
                    image: stores.logoUrl,
                    lat: stores.latitude,
                    lon: stores.longitude,
                    distance: distance,
                    deliveryRadius: stores.deliveryRadius,
                    deliveryType: stores.deliveryType,
                    storeCategoryId: stores.storeCategoryId,
                    shopType: stores.shopType,
                })
                .from(stores)
                .where(
                    and(
                        eq(stores.status, "ACTIVE"),
                        isNotNull(stores.latitude),
                        isNotNull(stores.longitude),
                        sql`${distanceExpr} <= ${serviceRadiusExpr}`
                    )
                )
                .orderBy(distance)
                .limit(limit);
        }

        return db
            .select()
            .from(stores)
            .where(eq(stores.status, "ACTIVE"))
            .limit(limit);
    }

    async getStore(
        idOrSlug: string,
        customerLat?: number,
        customerLon?: number
    ) {
        const store = await db.query.stores.findFirst({
            where: (stores, { eq, or }) =>
                or(eq(stores.id, idOrSlug), eq(stores.slug, idOrSlug)),
            with: {
                owner: true, // In real app, might mask owner details
            },
        });

        if (!store) throw new NotFoundError("Store");

        if (
            customerLat != null &&
            customerLon != null &&
            Number.isFinite(customerLat) &&
            Number.isFinite(customerLon)
        ) {
            const { checkDeliveryServiceability, effectiveServiceRadiusKm } = await import(
                "@/utils/geo"
            );
            const check = checkDeliveryServiceability({
                storeLatitude: store.latitude,
                storeLongitude: store.longitude,
                storeDeliveryRadius: store.deliveryRadius,
                storeDeliveryType: store.deliveryType,
                customerLatitude: customerLat,
                customerLongitude: customerLon,
                enforceDeliveryRadius: true,
            });
            const distanceKm =
                check.ok || check.distanceKm != null
                    ? Number((check.ok ? check.distanceKm : check.distanceKm!).toFixed(2))
                    : null;
            return {
                ...store,
                serviceability: {
                    deliverable: check.ok,
                    distanceKm,
                    maxRadiusKm: effectiveServiceRadiusKm(
                        store.deliveryType,
                        store.deliveryRadius
                    ),
                    code: check.ok ? null : check.code,
                    message: check.ok ? null : check.message,
                },
            };
        }

        return store;
    }

    // --- Categories ---

    async listCategories() {
        return db.select().from(categories).where(eq(categories.isActive, true));
    }

    async listStoreCategories() {
        return db
            .select({
                id: storeCategories.id,
                name: storeCategories.name,
                slug: storeCategories.slug,
                description: storeCategories.description,
                icon: storeCategories.icon,
            })
            .from(storeCategories)
            .where(eq(storeCategories.isActive, true));
    }

    // --- Products ---

    async searchProducts(params: {
        query?: string;
        categoryId?: string;
        storeCategoryId?: string;
        storeId?: string;
        minPrice?: number;
        maxPrice?: number;
        lat?: number;
        lon?: number;
        page?: number;
        limit?: number;
    }) {
        const page = params.page || 1;
        const limit = Math.min(params.limit || 20, 100);
        const offset = (page - 1) * limit;

        const conditions = [eq(products.isActive, true)];

        if (params.query) {
            conditions.push(ilike(products.name, `%${params.query}%`));
        }
        if (params.categoryId) {
            conditions.push(eq(products.categoryId, params.categoryId));
        }
        if (params.storeCategoryId) {
            // Match by store_category_id, category slug, or legacy shop_type
            // (many stores only set shop_type e.g. GROCERY without store_category_id).
            conditions.push(
                sql`${products.storeId} IN (
                    SELECT s.id FROM stores s
                    LEFT JOIN store_categories sc ON sc.id = s.store_category_id
                    WHERE s.store_category_id = ${params.storeCategoryId}
                       OR sc.slug = ${params.storeCategoryId}
                       OR LOWER(s.shop_type) = LOWER(${params.storeCategoryId})
                       OR LOWER(s.shop_type) = (
                            SELECT LOWER(sc2.slug)
                            FROM store_categories sc2
                            WHERE sc2.id = ${params.storeCategoryId}
                               OR sc2.slug = ${params.storeCategoryId}
                            LIMIT 1
                       )
                       OR LOWER(REPLACE(s.shop_type, '_', '-')) = (
                            SELECT LOWER(sc2.slug)
                            FROM store_categories sc2
                            WHERE sc2.id = ${params.storeCategoryId}
                               OR sc2.slug = ${params.storeCategoryId}
                            LIMIT 1
                       )
                )`
            );
        }
        if (params.storeId) {
            conditions.push(eq(products.storeId, params.storeId));
        }

        // Location-aware: only surface products from stores that can actually
        // deliver to (or are discoverable from) the customer's coordinates.
        if (
            params.lat != null &&
            params.lon != null &&
            Number.isFinite(params.lat) &&
            Number.isFinite(params.lon)
        ) {
            const lat = params.lat;
            const lon = params.lon;
            // NOTE: use a raw aliased subquery ("s") with snake_case column names.
            // Interpolating drizzle column objects (e.g. ${stores.status}) inside the
            // relational query builder remaps them to the outer "products" alias.
            conditions.push(sql`${products.storeId} IN (
                SELECT s.id FROM stores s
                WHERE s.status = 'ACTIVE'
                  AND s.latitude IS NOT NULL
                  AND s.longitude IS NOT NULL
                  AND (
                    6371 * acos(least(1.0, greatest(-1.0,
                      cos(radians(${lat})) * cos(radians(s.latitude)) *
                      cos(radians(s.longitude) - radians(${lon})) +
                      sin(radians(${lat})) * sin(radians(s.latitude))
                    )))
                  ) <= (
                    CASE WHEN s.delivery_type = 'PICKUP_ONLY'
                      THEN ${PICKUP_DISCOVERY_RADIUS_KM}
                      ELSE COALESCE(s.delivery_radius, ${DEFAULT_DELIVERY_RADIUS_KM})
                    END
                  )
            )`);
        }
        if (params.minPrice !== undefined) {
            conditions.push(gte(products.basePrice, params.minPrice.toString()));
        }
        if (params.maxPrice !== undefined) {
            conditions.push(lte(products.basePrice, params.maxPrice.toString()));
        }

        // Parallel Fetch: Ads + Organic
        const [organicData, sponsoredData] = await Promise.all([
            db.query.products.findMany({
                where: and(...conditions),
                limit: limit * 2, // Fetch double to allow reranking room
                offset,
                with: {
                    category: true,
                    store: true,
                    variants: {
                        where: eq(productVariants.isActive, true),
                        with: {
                            inventory: true,
                        },
                    },
                },
                orderBy: desc(products.createdAt),
            }),
            // Only fetch ads on first page and if searching/browsing
            (page === 1 && (params.query || params.categoryId))
                ? adService.getSponsoredProducts({ query: params.query, categoryId: params.categoryId })
                : Promise.resolve([])
        ]);

        let finalOrganic = organicData;

        // --- HYBRID RERANKING ---
        // If query exists, we rerank the organic results
        if (params.query && organicData.length > 0) {
            // Check if Search Service should be used (Feature Flag or implicit)
            try {
                // Map to candidate format
                const candidates = organicData.map(p => ({ id: p.id, entityId: p.id, original: p }));

                // Rerank
                const reranked = await searchService.hybridRerank(candidates, params.query);

                // Map back to Products (sorted)
                // Note: hybridRerank returns sorted candidates.
                // We need to handle items that might not have embeddings (score 0/undefined) - they go to bottom
                finalOrganic = reranked.map((c: any) => c.original);

                // If rerank returned subset (shouldn't happen if logic matches), fallback to original order for missing
                // Logic above uses IN clause, so it filters. We should merge missing ones if any.
            } catch (err) {
                console.warn("[Search Rerank Failed] Defaulting to simple SQL search:", err);
                // Fallback: finalOrganic is already set to organicData
            }
        }

        // Slice back to limit (since we fetched limit * 2)
        finalOrganic = finalOrganic.slice(0, limit);

        // Merge Ads at Top (Rank 0, 1)
        const combinedData = [...sponsoredData, ...finalOrganic];

        // Count query for pagination
        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(...conditions));

        const total = Number(countResult?.count || 0);

        return {
            data: combinedData,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getProduct(id: string) {
        const product = await db.query.products.findFirst({
            where: eq(products.id, id),
            with: {
                category: true,
                store: true,
                variants: {
                    where: eq(productVariants.isActive, true),
                    with: {
                        inventory: true,
                    },
                },
            },
        });

        if (!product) throw new NotFoundError("Product");
        return product;
    }
}

export const catalogService = new CatalogService();
