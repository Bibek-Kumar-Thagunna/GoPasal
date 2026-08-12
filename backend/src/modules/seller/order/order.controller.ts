import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { sellerOrderService } from "./order.service";
import { success } from "@/utils/response";
import { privateSellerShortTermCache } from "@/utils/http-cache-headers";

const orderStatusUpdate = t.Union([
    t.Literal("ACCEPTED"),
    t.Literal("CONFIRMED"),
    t.Literal("PACKED"),
    t.Literal("SHIPPED"),
    t.Literal("OUT_FOR_DELIVERY"),
    t.Literal("DELIVERED"),
    t.Literal("CANCELLED"),
]);

const orderGroupQuery = t.Optional(
    t.Union([
        t.Literal("ALL"),
        t.Literal("PENDING"),
        t.Literal("ACCEPTED"),
        t.Literal("PREPARING"),
        t.Literal("PACKED"),
        t.Literal("OUT_FOR_DELIVERY"),
        t.Literal("DELIVERED"),
        t.Literal("CANCELLED"),
    ])
);

export const sellerOrderController = new Elysia({ prefix: "/api/v1/seller/orders" })
    .derive(({ request }) => {
        const requestId =
            request.headers.get("x-request-id") ?? crypto.randomUUID();
        return { requestId };
    })
    .group("", (app) =>
        app
            .use(requireAuth())
            .use(requireTenant())
            .use(requireSellerPermission("orders.view"))
            .get(
                "/:id/detail",
                async ({ params, tenantId }) => {
                    const order = await sellerOrderService.getStoreOrder(tenantId, params.id);
                    return success(order);
                },
                {
                    params: t.Object({ id: t.String() }),
                    detail: {
                        tags: ["Seller - Order"],
                        summary: "Get a single order for the current store",
                    },
                }
            )
            .get(
                "/",
                async ({ tenantId, query, set }) => {
                    privateSellerShortTermCache(set);
                    const page = Number(query.page) || 1;
                    const limit = Math.min(Number(query.limit) || 20, 100);
                    const group = query.group ?? "ALL";
                    const [listResult, counts] = await Promise.all([
                        sellerOrderService.listStoreOrders(tenantId, { page, limit, group }),
                        sellerOrderService.getOrderTabCounts(tenantId),
                    ]);
                    return success({
                        orders: listResult.orders,
                        meta: {
                            page: listResult.page,
                            limit: listResult.limit,
                            total: listResult.total,
                            counts,
                        },
                    });
                },
                {
                    query: t.Object({
                        page: t.Optional(t.String()),
                        limit: t.Optional(t.String()),
                        group: orderGroupQuery,
                    }),
                    detail: {
                        tags: ["Seller - Order"],
                        summary: "List store orders with tab counts",
                    },
                }
            )
            .use(requireSellerPermission("orders.manage"))
            .put(
                "/:id/status",
                async ({ params, body, auth, tenantId, requestId }) => {
                    const result = await sellerOrderService.updateOrderStatus(
                        tenantId,
                        params.id,
                        body.status,
                        auth.userId,
                        { requestId, codCollected: body.codCollected }
                    );
                    return success(result);
                },
                {
                    params: t.Object({ id: t.String() }),
                    body: t.Object({
                        status: orderStatusUpdate,
                        codCollected: t.Optional(t.Boolean()),
                    }),
                    detail: {
                        tags: ["Seller - Order"],
                        summary: "Update order status with validated transitions",
                    },
                }
            )
    );
