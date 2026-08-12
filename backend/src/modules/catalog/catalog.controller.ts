import { Elysia, t } from "elysia";
import { CatalogService } from "./catalog.service";
import { success, paginated, buildPaginationMeta } from "@/utils/response";

const catalogService = new CatalogService();

export const catalogController = new Elysia({ prefix: "/api/v1" })

    // --- Stores ---
    .get(
        "/stores",
        async ({ query }) => {
            const lat = query.lat ? parseFloat(query.lat) : undefined;
            const lon = query.lon ? parseFloat(query.lon) : undefined;
            const stores = await catalogService.listStores(lat, lon);
            return success(stores);
        },
        {
            query: t.Object({
                lat: t.Optional(t.String()),
                lon: t.Optional(t.String()),
            }),
            detail: { tags: ["Catalog"], summary: "List active stores" },
        }
    )
    .get(
        "/stores/:id",
        async ({ params, query }) => {
            const lat = query.lat ? parseFloat(query.lat) : undefined;
            const lon = query.lon ? parseFloat(query.lon) : undefined;
            const store = await catalogService.getStore(params.id, lat, lon);
            return success(store);
        },
        {
            params: t.Object({ id: t.String() }),
            query: t.Object({
                lat: t.Optional(t.String()),
                lon: t.Optional(t.String()),
            }),
            detail: { tags: ["Catalog"], summary: "Get store details" },
        }
    )

    // --- Categories ---
    .get(
        "/categories",
        async () => {
            const categories = await catalogService.listCategories();
            return success(categories);
        },
        {
            detail: { tags: ["Catalog"], summary: "List product categories" },
        }
    )
    .get(
        "/store-categories",
        async () => {
            const storeCategories = await catalogService.listStoreCategories();
            return success(storeCategories);
        },
        {
            detail: {
                tags: ["Catalog"],
                summary: "List store types (seller onboarding categories)",
            },
        }
    )

    // --- Products ---
    .get(
        "/products",
        async ({ query }) => {
            const page = Number(query.page) || 1;
            const limit = Number(query.limit) || 20;

            const result = await catalogService.searchProducts({
                query: query.q,
                categoryId: query.categoryId,
                storeCategoryId: query.storeCategoryId,
                storeId: query.storeId,
                lat: query.lat ? parseFloat(query.lat) : undefined,
                lon: query.lon ? parseFloat(query.lon) : undefined,
                page,
                limit,
            });

            const meta = buildPaginationMeta(page, limit, result.total + (result.data.length === limit ? limit : 0)); // Hacky total guess
            return paginated(result.data, meta);
        },
        {
            query: t.Object({
                q: t.Optional(t.String()),
                categoryId: t.Optional(t.String()),
                storeCategoryId: t.Optional(t.String()),
                storeId: t.Optional(t.String()),
                lat: t.Optional(t.String()),
                lon: t.Optional(t.String()),
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            }),
            detail: { tags: ["Catalog"], summary: "Search products" },
        }
    )
    .get(
        "/products/:id",
        async ({ params }) => {
            const product = await catalogService.getProduct(params.id);
            return success(product);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Catalog"], summary: "Get product details" },
        }
    )
