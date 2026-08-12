import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { adminTenantService } from "./tenant.service";
import { success } from "@/utils/response";

// Needs SUPER_ADMIN or PLATFORM_OPERATOR role
export const adminTenantController = new Elysia({ prefix: "/api/v1/admin/tenants" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get(
        "/",
        async ({ query }) => {
            const page = query.page ? parseInt(query.page) : 1;
            const limit = query.limit ? parseInt(query.limit) : 20;
            const lane = query.lane as "review" | "active" | "suspended" | undefined;
            const result = await adminTenantService.listTenants(
                page,
                limit,
                query.q,
                lane
            );
            return success(result);
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                q: t.Optional(t.String()),
                lane: t.Optional(
                    t.Union([
                        t.Literal("review"),
                        t.Literal("active"),
                        t.Literal("suspended"),
                    ])
                ),
            }),
            detail: { tags: ["Admin - Tenant"], summary: "List tenants" }
        }
    )
    .get(
        "/:id",
        async ({ params }) => {
            const result = await adminTenantService.getTenantDetails(params.id);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Admin - Tenant"], summary: "Get tenant details" }
        }
    )
    .put(
        "/:id/status",
        async ({ params, body, auth }) => {
            const result = await adminTenantService.updateStatus(params.id, body.status, body.notes, auth.userId);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                status: t.Union([
                    t.Literal("CREATED"),
                    t.Literal("PENDING_APPROVAL"),
                    t.Literal("ACTIVE"),
                    t.Literal("SUSPENDED"),
                    t.Literal("TERMINATED"),
                ]),
                notes: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Tenant"], summary: "Update tenant status" }
        }
    )
    .put(
        "/:id/commission",
        async ({ params, body, auth }) => {
            const result = await adminTenantService.updateCommission(params.id, body.rate, auth.userId);
            return success(result);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({ rate: t.Number({ minimum: 0, maximum: 100 }) }),
            detail: { tags: ["Admin - Tenant"], summary: "Set commission rate" }
        }
    );
