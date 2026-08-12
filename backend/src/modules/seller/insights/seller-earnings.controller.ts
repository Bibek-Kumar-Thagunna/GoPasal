import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { storeService } from "@/modules/seller/store/store.service";
import { sellerInsightsService } from "./seller-insights.service";
import { invoiceService } from "@/modules/invoice/invoice.service";
import { success } from "@/utils/response";

export const sellerEarningsController = new Elysia({
    prefix: "/api/v1/seller/earnings",
})
    .group("", (app) =>
        app
        .use(requireAuth())
        .use(requireTenant())
        .get("/summary", async ({ auth, tenantId }) => {
            await storeService.assertOwner(auth.userId!, tenantId!);
            const summary = await sellerInsightsService.getEarningsSummary(tenantId!);
            return success(summary);
        })
        .get("/invoices", async ({ auth, tenantId }) => {
            await storeService.assertOwner(auth.userId!, tenantId!);
            const list = await invoiceService.listByStoreId(tenantId!);
            return success(list);
        })
);
