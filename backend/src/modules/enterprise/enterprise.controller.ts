import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { enterpriseService } from "./enterprise.service";
import { ForbiddenError } from "@/utils/errors";
import { EnterpriseProductService } from "./enterprise-product.service";
import { EnterpriseAnalyticsService } from "./enterprise-analytics.service";

export const enterpriseController = new Elysia({ prefix: "/enterprise" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN")) // Restricted to Admin mostly
    .decorate("productService", new EnterpriseProductService())
    .decorate("analyticsService", new EnterpriseAnalyticsService())
    .post("/master-merchant", async ({ body, auth }) => {
        const { name, ownerId } = body as any;
        return await enterpriseService.createMasterMerchant(ownerId || auth.userId, name);
    })
    .post("/rider-tier/calc/:riderId", async ({ params, body }) => {
        const { orders, rating } = body as any;
        await enterpriseService.updateRiderTier(params.riderId, orders, rating);
        return { success: true };
    })
    // --- New Enterprise Features ---
    .post("/template", async ({ body, auth, productService }) => {
        const owns = await productService.userOwnsMaster(auth.userId, body.masterId);
        if (!owns) {
            throw new ForbiddenError("You do not own this master store");
        }
        return await productService.createTemplate(body.masterId, body.data);
    }, {
        body: t.Object({
            masterId: t.String(),
            data: t.Any() // simplified validation for now
        })
    })
    .post("/template/:id/push", async ({ params, body, productService }) => {
        return await productService.pushTemplateToBranches(body.masterId, params.id);
    }, {
        body: t.Object({
            masterId: t.String()
        })
    })
    .get("/stats", async ({ query, analyticsService }) => {
        const masterId = query.masterId as string;
        if (!masterId) throw new Error("masterId required");
        return await analyticsService.getConsolidatedStats(masterId);
    })
    .get("/stats/breakdown", async ({ query, analyticsService }) => {
        const masterId = query.masterId as string;
        if (!masterId) throw new Error("masterId required");
        return await analyticsService.getBranchBreakdown(masterId);
    });
