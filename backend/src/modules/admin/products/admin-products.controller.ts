import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { success } from "@/utils/response";
import { adminProductsService } from "./admin-products.service";

export const adminProductsController = new Elysia({
    prefix: "/api/v1/admin/catalog/products",
})
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get(
        "/",
        async ({ query }) => {
            const page = query.page ? parseInt(query.page, 10) : 1;
            const limit = query.limit ? parseInt(query.limit, 10) : 25;
            const onlyActive =
                query.includeInactive === "true" || query.includeInactive === "1"
                    ? false
                    : true;
            const result = await adminProductsService.listProducts({
                page,
                limit,
                q: query.q,
                storeId: query.storeId,
                onlyActive,
            });
            return success(result);
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                q: t.Optional(t.String()),
                storeId: t.Optional(t.String()),
                includeInactive: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Catalog"], summary: "List products (admin)" },
        }
    )
    .get("/stores", async () => {
        const rows = await adminProductsService.listStoreOptions();
        return success(rows);
    })
    .patch(
        "/:id/active",
        async ({ params, body }) => {
            const row = await adminProductsService.setProductActive(params.id, body.isActive);
            return success(row);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({ isActive: t.Boolean() }),
            detail: { tags: ["Admin - Catalog"], summary: "Activate or deactivate product" },
        }
    );
