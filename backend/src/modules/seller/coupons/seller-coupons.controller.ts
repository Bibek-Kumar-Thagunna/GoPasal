import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireTenant } from "@/middlewares/tenant";
import { requireSellerPermission } from "@/middlewares/seller-store-permission";
import { growthService } from "@/modules/growth/growth.service";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ConflictError, ValidationError } from "@/utils/errors";
import { success, created } from "@/utils/response";

export const sellerCouponsController = new Elysia({
    prefix: "/api/v1/seller/coupons",
}).group("", (app) =>
    app
        .use(requireAuth())
        .use(requireTenant())
        .use(requireSellerPermission("promotions.manage"))
        .get("/", async ({ tenantId }) => {
            const list = await growthService.listCouponsForStore(tenantId!);
            return success(list);
        })
        .post(
            "/",
            async ({ tenantId, body, auth }) => {
                const code = body.code.trim().toUpperCase();
                if (code.length < 3) {
                    throw new ValidationError("Coupon code must be at least 3 characters");
                }
                const [dup] = await db
                    .select()
                    .from(coupons)
                    .where(and(eq(coupons.storeId, tenantId!), eq(coupons.code, code)))
                    .limit(1);
                if (dup) {
                    throw new ConflictError("This coupon code is already used for this store");
                }
                await growthService.createCoupon(tenantId!, {
                    code,
                    type: body.type,
                    value: String(body.value),
                    minOrderValue: String(body.minOrderValue ?? 0),
                    maxDiscount: body.maxDiscount != null ? String(body.maxDiscount) : null,
                    startDate: new Date(body.startDate),
                    endDate: new Date(body.endDate),
                    status: "ACTIVE",
                    requiresGold: body.requiresMembership ?? false,
                    usageLimitTotal: body.usageLimitTotal ?? null,
                    usageLimitPerUser: body.usageLimitPerUser ?? 1,
                    createdBy: auth.userId,
                });
                return created({ success: true });
            },
            {
                body: t.Object({
                    code: t.String({ minLength: 3, maxLength: 20 }),
                    type: t.Union([t.Literal("FIXED"), t.Literal("PERCENT")]),
                    value: t.Number({ minimum: 0 }),
                    minOrderValue: t.Optional(t.Number({ minimum: 0 })),
                    maxDiscount: t.Optional(t.Number({ minimum: 0 })),
                    startDate: t.String({ minLength: 8 }),
                    endDate: t.String({ minLength: 8 }),
                    usageLimitTotal: t.Optional(t.Integer({ minimum: 1 })),
                    usageLimitPerUser: t.Optional(t.Integer({ minimum: 1 })),
                    requiresMembership: t.Optional(t.Boolean()),
                }),
            }
        )
        .patch(
            "/:id/status",
            async ({ params, body, tenantId }) => {
                const { adminCouponsService } = await import(
                    "@/modules/admin/promotions/admin-coupons.service"
                );
                await adminCouponsService.updateStatusForStore(
                    params.id,
                    tenantId!,
                    body.status
                );
                return success({ success: true });
            },
            {
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    status: t.Union([t.Literal("ACTIVE"), t.Literal("PAUSED")]),
                }),
            }
        )
);
