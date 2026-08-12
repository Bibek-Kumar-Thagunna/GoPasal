import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { created, success } from "@/utils/response";
import { adminCouponsService } from "./admin-coupons.service";

export const adminPromotionsController = new Elysia({
    prefix: "/api/v1/admin/promotions",
})
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))
    .get(
        "/coupons",
        async ({ query }) => {
            const page = query.page ? parseInt(query.page, 10) : 1;
            const limit = query.limit ? parseInt(query.limit, 10) : 25;
            const result = await adminCouponsService.listCoupons({
                page,
                limit,
                q: query.q,
                storeId: query.storeId,
            });
            return success(result);
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
                q: t.Optional(t.String()),
                storeId: t.Optional(t.String()),
            }),
            detail: { tags: ["Admin - Promotions"], summary: "List coupons" },
        }
    )
    .patch(
        "/coupons/:id/status",
        async ({ params, body }) => {
            const row = await adminCouponsService.updateStatus(params.id, body.status);
            return success(row);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                status: t.Union([t.Literal("ACTIVE"), t.Literal("PAUSED")]),
            }),
            detail: { tags: ["Admin - Promotions"], summary: "Pause or activate coupon" },
        }
    )
    .post(
        "/coupons",
        async ({ body, auth, set }) => {
            const res = await adminCouponsService.createCoupon({
                storeId: body.storeId,
                code: body.code,
                type: body.type,
                value: String(body.value),
                minOrderValue: String(body.minOrderValue ?? 0),
                maxDiscount:
                    body.maxDiscount !== undefined && body.maxDiscount !== null
                        ? String(body.maxDiscount)
                        : null,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                usageLimitTotal: body.usageLimitTotal ?? null,
                usageLimitPerUser: body.usageLimitPerUser ?? 1,
                requiresMembership: body.requiresMembership ?? false,
                createdBy: auth.userId,
            });
            set.status = 201;
            return created(res);
        },
        {
            body: t.Object({
                storeId: t.Optional(t.String()),
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
            detail: { tags: ["Admin - Promotions"], summary: "Create coupon (omit storeId for platform-wide)" },
        }
    );
