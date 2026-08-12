import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { success, created } from "@/utils/response";
import { storeMarketingService } from "@/modules/growth/store-marketing.service";

export const sellerStoreMarketingController = new Elysia({
    prefix: "/api/v1/seller/marketing",
})
    .use(requireAuth())
    .get("/plans", async () => {
        const plans = await storeMarketingService.listActivePlans();
        return success(plans);
    })
    .group("", (app) =>
        app
            .use(requireTenant())
            .get("/subscription", async ({ tenantId }) => {
                const ctx = await storeMarketingService.getActiveForStore(tenantId!);
                return success(ctx);
            })
            .use(requireSellerPermission("promotions.manage"))
            .post(
                "/subscribe",
                async ({ tenantId, body, set }) => {
                    const res = await storeMarketingService.subscribeStore(
                        tenantId!,
                        body.planId,
                        body.paymentToken ?? ""
                    );
                    set.status = 201;
                    return created(res);
                },
                {
                    body: t.Object({
                        planId: t.String({ minLength: 1 }),
                        paymentToken: t.Optional(t.String()),
                    }),
                }
            )
    );
