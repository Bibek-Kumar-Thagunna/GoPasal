import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { adminConfigService } from "./config.service";
import { success } from "@/utils/response";

export const adminConfigController = new Elysia({ prefix: "/api/v1/admin/configs" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN")) // Only Super Admin
    .get(
        "/",
        async () => {
            const result = await adminConfigService.listConfigs();
            return success(result);
        },
        {
            detail: { tags: ["Admin - Config"], summary: "List system configs" }
        }
    )
    .put(
        "/:key",
        async ({ params, body, auth }) => {
            const result = await adminConfigService.updateConfig(params.key, body.value, body.description, auth.userId);
            return success(result);
        },
        {
            params: t.Object({ key: t.String() }),
            body: t.Object({
                value: t.Any(),
                description: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Config"], summary: "Upsert system config" }
        }
    );
