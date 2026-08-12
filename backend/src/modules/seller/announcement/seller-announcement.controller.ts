import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { sellerAnnouncementService } from "./seller-announcement.service";
import { success, created } from "@/utils/response";

const scopeBody = t.Union([
    t.Literal("SINGLE_STORE"),
    t.Literal("ALL_BRANCHES"),
]);

export const sellerAnnouncementController = new Elysia({
    prefix: "/api/v1/seller/announcements",
})
    .group("", (app) =>
        app
        .use(requireAuth())
        .use(requireTenant())
        .use(requireSellerPermission("announcements.view"))
        .get("/", async ({ auth, tenantId }) => {
            const rows = await sellerAnnouncementService.listForStore(auth.userId!, tenantId!);
            return success(rows);
        })
        .use(requireSellerPermission("announcements.manage"))
        .post(
            "/",
            async ({ auth, tenantId, body }) => {
                const row = await sellerAnnouncementService.create({
                    authorId: auth.userId!,
                    tenantStoreId: tenantId!,
                    scope: body.scope,
                    title: body.title,
                    body: body.body,
                    targetStoreId: body.targetStoreId,
                });
                return created(row);
            },
            {
                body: t.Object({
                    scope: scopeBody,
                    title: t.String({ minLength: 1, maxLength: 200 }),
                    body: t.String({ minLength: 1, maxLength: 8000 }),
                    targetStoreId: t.Optional(t.String()),
                }),
            }
        )
);
