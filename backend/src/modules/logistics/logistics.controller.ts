import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares";
import { requireRole } from "@/middlewares/rbac";
import { success, created } from "@/utils/response";
import { tripService, predictiveService } from "./trip.service";
import { walletService } from "./wallet.service";

export const logisticsController = new Elysia({ prefix: "/api/v1/logistics" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN"))
    .get(
        "/trips",
        async () => {
            const trips = await tripService.listTrips();
            return success(trips);
        },
        {
            detail: { tags: ["Logistics"], summary: "List trips" },
        }
    )
    .post(
        "/trips",
        async ({ body, set }) => {
            const tripId = await tripService.createTrip(body.taskIds, body.riderId);
            set.status = 201;
            return created({ id: tripId });
        },
        {
            body: t.Object({
                taskIds: t.Array(t.String()),
                riderId: t.String(),
            }),
            detail: { tags: ["Logistics"], summary: "Create trip" },
        }
    )
    .get(
        "/deposits",
        async () => {
            const deposits = await walletService.listDeposits();
            return success(deposits);
        },
        {
            detail: { tags: ["Logistics"], summary: "List rider deposits" },
        }
    )
    .put(
        "/deposits/:id/verify",
        async ({ auth, params }) => {
            await walletService.verifyDeposit(params.id, auth.userId);
            return success({ verified: true });
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Logistics"], summary: "Verify deposit" },
        }
    )
    .get(
        "/alerts",
        async () => {
            const alerts = await predictiveService.getAlerts();
            return success(alerts);
        },
        {
            detail: { tags: ["Logistics"], summary: "Get predictive alerts" },
        }
    );
