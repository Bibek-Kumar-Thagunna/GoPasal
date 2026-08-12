import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares";
import { requireRole } from "@/middlewares/rbac";
import { success, created } from "@/utils/response";
import { adService } from "./ad.service";
import { storeService } from "@/modules/seller/store/store.service";

export const adController = new Elysia({ prefix: "/api/v1/ads" })
    .get(
        "/sponsored",
        async ({ query }) => {
            const context = {
                query: query.keywords?.[0],
                categoryId: query.categoryId,
            };
            const products = await adService.getSponsoredProducts(context);
            return success(products);
        },
        {
            query: t.Object({
                keywords: t.Optional(t.Array(t.String())),
                categoryId: t.Optional(t.String()),
            }),
            detail: { tags: ["Ads"], summary: "Get sponsored products" },
        }
    )
    .post(
        "/impressions",
        async ({ body }) => {
            await adService.trackImpression(
                body.campaignId,
                body.storeId,
                body.targetId,
                body.cost
            );
            return success({ tracked: true });
        },
        {
            body: t.Object({
                campaignId: t.String(),
                storeId: t.String(),
                targetId: t.String(),
                cost: t.Number(),
            }),
            detail: { tags: ["Ads"], summary: "Track impression" },
        }
    )
    .use(requireAuth())
    .use(requireRole("SELLER_OWNER"))
    .post(
        "/campaigns",
        async ({ auth, body, set }) => {
            const store = await storeService.getMyStore(auth.userId);
            if (!store) throw new Error("No store found for seller");
            const result = await adService.createCampaign(store.id, {
                name: body.name,
                dailyBudget: body.dailyBudget,
                startDate: new Date(body.startDate),
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                targets: body.targets,
            });
            set.status = 201;
            return created(result);
        },
        {
            body: t.Object({
                name: t.String(),
                dailyBudget: t.Number(),
                startDate: t.String(),
                endDate: t.Optional(t.String()),
                targets: t.Optional(t.Array(t.Object({
                    targetType: t.Union([t.Literal("KEYWORD"), t.Literal("CATEGORY"), t.Literal("PRODUCT")]),
                    targetValue: t.String(),
                    bidAmount: t.Number(),
                }))),
            }),
            detail: { tags: ["Ads"], summary: "Create campaign" },
        }
    )
    .get(
        "/campaigns",
        async ({ auth }) => {
            const store = await storeService.getMyStore(auth.userId);
            if (!store) return success([]);
            const campaigns = await adService.listCampaigns(store.id);
            return success(campaigns);
        },
        {
            detail: { tags: ["Ads"], summary: "List campaigns" },
        }
    );
