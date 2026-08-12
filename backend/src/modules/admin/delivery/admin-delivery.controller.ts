import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { success } from "@/utils/response";
import { adminDeliveryService } from "./admin-delivery.service";

export const adminDeliveryOpsController = new Elysia({
    prefix: "/api/v1/admin/delivery",
})
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get(
        "/riders",
        async ({ query }) => {
            const lim = query.limit ? parseInt(query.limit, 10) : 200;
            const riders = await adminDeliveryService.listRiders(lim);
            return success(riders);
        },
        {
            query: t.Object({ limit: t.Optional(t.String()) }),
            detail: { tags: ["Admin - Delivery"], summary: "List riders" },
        }
    )
    .get(
        "/tasks",
        async ({ query }) => {
            const lim = query.limit ? parseInt(query.limit, 10) : 50;
            const tasks = await adminDeliveryService.listRecentTasks(
                lim,
                query.status
            );
            return success(tasks);
        },
        {
            query: t.Object({
                limit: t.Optional(t.String()),
                status: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Delivery"], summary: "Recent delivery tasks" },
        }
    )
    .patch(
        "/tasks/:taskId/assign",
        async ({ params, body }) => {
            const result = await adminDeliveryService.assignRiderToTask(
                params.taskId,
                body.riderId
            );
            return success(result);
        },
        {
            params: t.Object({ taskId: t.String() }),
            body: t.Object({ riderId: t.String({ minLength: 1 }) }),
            detail: { tags: ["Admin - Delivery"], summary: "Assign rider to delivery task" },
        }
    );
