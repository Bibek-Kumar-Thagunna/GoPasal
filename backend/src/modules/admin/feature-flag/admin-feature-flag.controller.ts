import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { featureFlagService } from "@/modules/admin/feature-flag.service";
import { generateId } from "@/utils";
import { success } from "@/utils/response";
import { PLATFORM_DELIVERY_FLAG_KEY } from "@/modules/config/platform-delivery";

export const adminFeatureFlagController = new Elysia({
    prefix: "/api/v1/admin/feature-flags",
})
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get("/", async () => {
        const rows = await db.select().from(featureFlags).orderBy(featureFlags.key);
        return success(rows);
    })
    .patch(
        "/:key",
        async ({ params, body, auth }) => {
            await featureFlagService.setFlag(params.key, body.isEnabled);
            return success({ key: params.key, isEnabled: body.isEnabled, updatedBy: auth.userId });
        },
        {
            params: t.Object({ key: t.String({ minLength: 1 }) }),
            body: t.Object({ isEnabled: t.Boolean() }),
            detail: { tags: ["Admin - Config"], summary: "Toggle a feature flag" },
        }
    )
    .post(
        "/seed-defaults",
        async () => {
            const defaults = [
                {
                    key: PLATFORM_DELIVERY_FLAG_KEY,
                    description:
                        "When enabled, sellers can choose GoPasal fleet (PLATFORM/HYBRID) and customers can select platform delivery at checkout.",
                    isEnabled: false,
                    clientSide: true,
                },
            ];
            for (const d of defaults) {
                const [existing] = await db
                    .select()
                    .from(featureFlags)
                    .where(eq(featureFlags.key, d.key))
                    .limit(1);
                if (!existing) {
                    await db.insert(featureFlags).values({
                        id: generateId(),
                        key: d.key,
                        description: d.description,
                        isEnabled: d.isEnabled,
                        clientSide: d.clientSide,
                        env: "production",
                    });
                }
            }
            return success({ message: "Default flags ensured" });
        },
        {
            detail: { tags: ["Admin - Config"], summary: "Ensure default feature flags exist" },
        }
    );
