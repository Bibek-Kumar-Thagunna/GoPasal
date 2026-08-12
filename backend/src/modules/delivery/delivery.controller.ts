import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { deliveryService } from "./delivery.service";
import { success, created } from "@/utils/response";

export const deliveryController = new Elysia({ prefix: "/api/v1/riders" })
    .use(requireAuth())
    .post(
        "/onboard",
        async ({ body, auth }) => {
            const result = await deliveryService.onboardRider(auth.userId, body);
            return created(result);
        },
        {
            body: t.Object({
                vehicleType: t.String(),
                licensePlate: t.String(),
            }),
            detail: { tags: ["Delivery"], summary: "Become a rider" }
        }
    )
    .get(
        "/me",
        async ({ auth }) => {
            const result = await deliveryService.getRiderProfile(auth.userId);
            return success(result);
        },
        {
            detail: { tags: ["Delivery"], summary: "Get rider profile" }
        }
    )
    .put(
        "/status",
        async ({ body, auth }) => {
            const result = await deliveryService.updateStatus(auth.userId, body.status as any, body.lat, body.lon);
            return success(result);
        },
        {
            body: t.Object({
                status: t.Union([
                    t.Literal("ONLINE"),
                    t.Literal("OFFLINE"),
                    t.Literal("ON_DELIVERY"),
                ]),
                lat: t.Optional(t.Number()),
                lon: t.Optional(t.Number()),
            }),
            detail: { tags: ["Delivery"], summary: "Update status & location" }
        }
    )
    .get(
        "/tasks/available",
        async ({ auth, query }) => {
            const lat = query.lat ? parseFloat(query.lat) : undefined;
            const lon = query.lon ? parseFloat(query.lon) : undefined;
            const result = await deliveryService.findAvailableTasks(auth.userId, lat, lon);
            return success(result);
        },
        {
            query: t.Object({
                lat: t.Optional(t.String()),
                lon: t.Optional(t.String()),
            }),
            detail: { tags: ["Delivery"], summary: "Find delivery tasks" }
        }
    )
    .get(
        "/tasks",
        async ({ auth }) => {
            const result = await deliveryService.getAssignedTasks(auth.userId);
            return success(result);
        },
        {
            detail: { tags: ["Delivery"], summary: "Get assigned tasks" }
        }
    )
    .get(
        "/tasks/history",
        async ({ auth, query }) => {
            const limit = query.limit ? parseInt(query.limit, 10) : 50;
            const result = await deliveryService.getTaskHistory(auth.userId, limit);
            return success(result);
        },
        {
            query: t.Object({ limit: t.Optional(t.String()) }),
            detail: { tags: ["Delivery"], summary: "Get completed task history" }
        }
    )
    .get(
        "/tasks/:id",
        async ({ auth, params }) => {
            const result = await deliveryService.getTaskDetail(auth.userId, params.id);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Delivery"], summary: "Get task detail (pending or assigned)" }
        }
    )
    .post(
        "/tasks/:id/accept",
        async ({ auth, params }) => {
            const result = await deliveryService.acceptTask(auth.userId, params.id);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Delivery"], summary: "Accept a task" }
        }
    )
    .put(
        "/tasks/:id/status",
        async ({ auth, params, body }) => {
            const result = await deliveryService.updateTaskStatus(
                auth.userId,
                params.id,
                body.status as any,
                auth.roles, // Pass Roles for State Machine
                {
                    podImageUrl: body.podImageUrl,
                    podNotes: body.podNotes,
                    codCollected: body.codCollected,
                    codAmount: body.codAmount,
                }
            );
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                status: t.Union([
                    t.Literal("PICKED_UP"),
                    t.Literal("DELIVERED"),
                    t.Literal("FAILED"),
                    t.Literal("CANCELLED"),
                    t.Literal("RETURN_INITIATED"),
                    t.Literal("RETURNED_TO_SELLER"),
                ]),
                podImageUrl: t.Optional(t.String()),
                podNotes: t.Optional(t.String()),
                codCollected: t.Optional(t.Boolean()),
                codAmount: t.Optional(t.Number()),
            }),
            detail: { tags: ["Delivery"], summary: "Update task status (Rider)" }
        }
    );
