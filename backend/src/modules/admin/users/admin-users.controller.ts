import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { success } from "@/utils/response";
import { adminUsersService } from "./admin-users.service";

export const adminUsersController = new Elysia({ prefix: "/api/v1/admin/users" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get(
        "/",
        async ({ query }) => {
            const page = query.page ? parseInt(query.page, 10) : 1;
            const limit = query.limit ? parseInt(query.limit, 10) : 25;
            const result = await adminUsersService.listUsers({
                page,
                limit,
                q: query.q,
            });
            return success(result);
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                q: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Users"], summary: "List users" },
        }
    )
    .patch(
        "/:id/active",
        async ({ params, body, auth }) => {
            const row = await adminUsersService.setUserActive(
                params.id,
                body.isActive,
                auth.userId
            );
            return success(row);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({ isActive: t.Boolean() }),
            detail: { tags: ["Admin - Users"], summary: "Enable or disable user" },
        }
    );
