import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { success } from "@/utils/response";
import { adminOrdersService } from "./admin-orders.service";

export const adminOrdersController = new Elysia({ prefix: "/api/v1/admin/orders" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get(
        "/",
        async ({ query }) => {
            const page = query.page ? parseInt(query.page, 10) : 1;
            const limit = query.limit ? parseInt(query.limit, 10) : 25;
            const result = await adminOrdersService.listOrders({
                page,
                limit,
                status: query.status,
                q: query.q,
            });
            return success(result);
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                status: t.Optional(t.String()),
                q: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Orders"], summary: "List orders" },
        }
    )
    .get(
        "/:orderId",
        async ({ params }) => {
            const result = await adminOrdersService.getOrderDetail(params.orderId);
            return success(result);
        },
        {
            params: t.Object({ orderId: t.String() }),
            detail: { tags: ["Admin - Orders"], summary: "Get order detail" },
        }
    );
