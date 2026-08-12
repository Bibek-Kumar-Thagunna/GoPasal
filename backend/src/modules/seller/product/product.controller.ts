import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { productService } from "./product.service";
import { AuthError } from "@/utils/errors";
import { success, created } from "@/utils/response";

export const productController = new Elysia({ prefix: "/api/v1/seller/products" })
    .group("", (app) =>
        app
        .use(requireAuth())
        .use(requireTenant())
        .use(requireSellerPermission("products.view"))
        .get(
            "/",
            async ({ tenantId }) => {
                const result = await productService.listMyProducts(tenantId);
                return success(result);
            },
            {
                detail: {
                    tags: ["Seller - Product"],
                    summary: "List my products",
                },
            }
        )
        .get(
            "/:id",
            async ({ params, tenantId }) => {
                const result = await productService.getProduct(tenantId, params.id);
                return success(result);
            },
            {
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Seller - Product"],
                    summary: "Get my product details",
                },
            }
        )
        .use(requireSellerPermission("products.manage"))
        .post(
            "/",
            async ({ body, auth, tenantId }) => {
                if (!auth.userId) throw new AuthError("User ID required");
                const result = await productService.createProduct(tenantId, auth.userId, body);
                return created(result);
            },
            {
                body: t.Object({
                    categoryId: t.String(),
                    name: t.String({ minLength: 3 }),
                    description: t.Optional(t.String()),
                    basePrice: t.Number({ minimum: 0 }),
                    compareAtPrice: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
                    isDeliverable: t.Optional(t.Boolean()),
                    sku: t.Optional(t.String()),
                    stock: t.Number({ minimum: 0 }),
                    images: t.Optional(t.Array(t.String())),
                }),
                detail: {
                    tags: ["Seller - Product"],
                    summary: "Create a product",
                },
            }
        )
        .put(
            "/:id",
            async ({ params, body, auth, tenantId }) => {
                const result = await productService.updateProduct(
                    tenantId,
                    params.id,
                    auth.userId,
                    body
                );
                return success(result);
            },
            {
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    name: t.Optional(t.String({ minLength: 3 })),
                    description: t.Optional(t.String()),
                    basePrice: t.Optional(t.Number({ minimum: 0 })),
                    compareAtPrice: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
                    isDeliverable: t.Optional(t.Boolean()),
                    isActive: t.Optional(t.Boolean()),
                    images: t.Optional(t.Array(t.String())),
                    categoryId: t.Optional(t.String({ minLength: 1 })),
                    sku: t.Optional(t.String({ maxLength: 100 })),
                }),
                detail: {
                    tags: ["Seller - Product"],
                    summary: "Update a product",
                },
            }
        )
        .delete(
            "/:id",
            async ({ params, auth, tenantId }) => {
                const result = await productService.deleteProduct(tenantId, params.id, auth.userId);
                return success(result);
            },
            {
                params: t.Object({ id: t.String() }),
                detail: {
                    tags: ["Seller - Product"],
                    summary: "Archive a product",
                },
            }
        )
        .patch(
            "/:id/inventory",
            async ({ params, body, auth, tenantId }) => {
                const result = await productService.updateStock(
                    tenantId,
                    params.id,
                    body.quantity,
                    auth.userId
                );
                return success(result);
            },
            {
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    quantity: t.Number({ minimum: 0 }),
                }),
                detail: {
                    tags: ["Seller - Product"],
                    summary: "Update product stock",
                },
            }
        )
);
