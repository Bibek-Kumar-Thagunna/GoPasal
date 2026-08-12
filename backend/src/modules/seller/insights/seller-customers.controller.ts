import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { sellerInsightsService } from "./seller-insights.service";
import { success } from "@/utils/response";

export const sellerCustomersController = new Elysia({
    prefix: "/api/v1/seller/customers",
})
    .group("", (app) =>
        app
        .use(requireAuth())
        .use(requireTenant())
        .use(requireSellerPermission("orders.view"))
        .get("/", async ({ tenantId }) => {
            const rows = await sellerInsightsService.listCustomersForStore(tenantId!);
            return success(rows);
        })
);
