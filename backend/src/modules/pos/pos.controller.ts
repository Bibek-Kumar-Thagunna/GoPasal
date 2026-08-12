import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { db } from "@/db";
import { posIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/utils";
import { success } from "@/utils/response";
import { posService } from "./pos.service";

export const posController = new Elysia({ prefix: "/api/v1/seller/pos" })
    .group("", (app) =>
        app
        .use(requireAuth())
        .use(requireTenant())
        .use(requireSellerPermission("pos.configure"))
    
        .get(
            "/",
            async ({ tenantId }) => {
                const [integration] = await db.select().from(posIntegrations).where(eq(posIntegrations.storeId, tenantId));
            return success(integration || null);
        },
        {
            detail: { tags: ["Seller - POS"], summary: "Get POS Integration Status" }
        }
    )

    .put(
        "/config",
        async ({ tenantId, body }) => {
            const [existing] = await db.select().from(posIntegrations).where(eq(posIntegrations.storeId, tenantId));

            if (existing) {
                const [updated] = await db.update(posIntegrations)
                    .set({
                        provider: body.provider as any,
                        config: body.config, // In real app: Encrypt here!
                        status: body.status as any,
                        updatedAt: new Date()
                    })
                    .where(eq(posIntegrations.id, existing.id))
                    .returning();
                return success(updated);
            } else {
                const [created] = await db.insert(posIntegrations)
                    .values({
                        id: generateId(),
                        storeId: tenantId,
                        provider: body.provider as any,
                        config: body.config,
                        status: body.status as any || "ACTIVE"
                    })
                    .returning();
                return success(created);
            }
        },
        {
            body: t.Object({
                provider: t.Union([t.Literal("IMS"), t.Literal("SQUARE"), t.Literal("CLOVER"), t.Literal("CUSTOM")]),
                config: t.String(),
                status: t.Optional(t.Union([t.Literal("ACTIVE"), t.Literal("PAUSED")]))
            }),
            detail: { tags: ["Seller - POS"], summary: "Configure POS Integration" }
        }
    )

    .post(
        "/sync",
        async ({ tenantId }) => {
            // Trigger Sync (Async or Await based on preference. Await for manual trigger is better UX)
            await posService.syncMenu(tenantId);
            return success({ message: "Sync completed" });
        },
        {
            detail: { tags: ["Seller - POS"], summary: "Trigger Manual Menu Sync" }
        }
    )
);
