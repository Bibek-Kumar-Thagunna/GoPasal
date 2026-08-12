import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { FlashSaleService } from "./flash-sale.service";

const flashSaleService = new FlashSaleService();

export const flashSaleController = new Elysia({ prefix: "/flash-sale" })
    .use(requireAuth())

    // Admin
    .group("/admin", (app) => app
        .use(requireRole("SUPER_ADMIN"))
        .post("/init", async ({ body }) => {
            const { eventId, variantId, stock } = body as any;
            await flashSaleService.initializeStock(eventId, variantId, stock);
            return { success: true };
        }, {
            body: t.Object({
                eventId: t.String(),
                variantId: t.String(),
                stock: t.Number()
            })
        })
        .post("/reconcile", async () => {
            return await flashSaleService.reconcileInventory();
        })
    )
    .post("/reconcile", async () => {
        return await flashSaleService.reconcileInventory();
    })

    // Public / Admission
    .post("/admission", async ({ body, auth }) => {
        const { eventId } = body as { eventId: string };
        return await flashSaleService.checkAdmission(eventId, auth.userId);
    }, {
        body: t.Object({ eventId: t.String() })
    });
