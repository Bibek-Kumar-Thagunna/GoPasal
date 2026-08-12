import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { requireAuth } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/rbac";
import { db } from "@/db";
import {
    subscriptionPlans,
    userSubscriptions,
    storeMarketingPlans,
    storeMarketingSubscriptions,
} from "@/db/schema";
import { success } from "@/utils/response";

type CustomerPlanPatch = Pick<
    InferInsertModel<typeof subscriptionPlans>,
    | "isActive"
    | "name"
    | "slug"
    | "benefits"
    | "price"
    | "durationDays"
    | "deliveryFreeThreshold"
    | "isPriorityDelivery"
>;

type StoreMarketingPlanPatch = Pick<
    InferInsertModel<typeof storeMarketingPlans>,
    "isActive" | "name" | "description" | "monthlyPrice" | "benefits"
>;

function buildCustomerPlanPatch(body: {
    isActive?: boolean;
    name?: string;
    slug?: string;
    benefits?: Record<string, unknown>;
    price?: string;
    durationDays?: number;
    deliveryFreeThreshold?: string;
    isPriorityDelivery?: boolean;
}): Partial<CustomerPlanPatch> {
    const patch: Partial<CustomerPlanPatch> = {};
    if (body.isActive !== undefined) patch.isActive = body.isActive;
    if (body.name !== undefined) patch.name = body.name;
    if (body.slug !== undefined) patch.slug = body.slug;
    if (body.benefits !== undefined) patch.benefits = body.benefits;
    if (body.price !== undefined) patch.price = body.price;
    if (body.durationDays !== undefined) patch.durationDays = body.durationDays;
    if (body.deliveryFreeThreshold !== undefined) {
        patch.deliveryFreeThreshold = body.deliveryFreeThreshold;
    }
    if (body.isPriorityDelivery !== undefined) {
        patch.isPriorityDelivery = body.isPriorityDelivery;
    }
    return patch;
}

function buildStorePlanPatch(body: {
    isActive?: boolean;
    name?: string;
    description?: string;
    monthlyPrice?: string;
    benefits?: Record<string, unknown>;
}): Partial<StoreMarketingPlanPatch> {
    const patch: Partial<StoreMarketingPlanPatch> = {};
    if (body.isActive !== undefined) patch.isActive = body.isActive;
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.monthlyPrice !== undefined) patch.monthlyPrice = body.monthlyPrice;
    if (body.benefits !== undefined) patch.benefits = body.benefits;
    return patch;
}

export const adminTiersController = new Elysia({ prefix: "/api/v1/admin/tiers" })
    .use(requireAuth())
    .use(requireRole("SUPER_ADMIN", "PLATFORM_OPERATOR"))

    .get("/customer-plans", async () => {
        const plans = await db.select().from(subscriptionPlans);
        return success(plans);
    })

    .patch(
        "/customer-plans/:id",
        async ({ params, body }) => {
            const partial = buildCustomerPlanPatch(body);
            await db
                .update(subscriptionPlans)
                .set({
                    ...partial,
                    updatedAt: new Date(),
                })
                .where(eq(subscriptionPlans.id, params.id));
            const [row] = await db
                .select()
                .from(subscriptionPlans)
                .where(eq(subscriptionPlans.id, params.id));
            return success(row);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                isActive: t.Optional(t.Boolean()),
                name: t.Optional(t.String()),
                slug: t.Optional(t.String()),
                benefits: t.Optional(t.Record(t.String(), t.Unknown())),
                price: t.Optional(t.String()),
                durationDays: t.Optional(t.Integer()),
                deliveryFreeThreshold: t.Optional(t.String()),
                isPriorityDelivery: t.Optional(t.Boolean()),
            }),
        }
    )

    .get("/customer-subscriptions", async () => {
        const rows = await db
            .select({
                subscription: userSubscriptions,
                plan: subscriptionPlans,
            })
            .from(userSubscriptions)
            .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
            .limit(200);
        return success(rows);
    })

    .get("/store-plans", async () => {
        const plans = await db.select().from(storeMarketingPlans);
        return success(plans);
    })

    .patch(
        "/store-plans/:id",
        async ({ params, body }) => {
            const partial = buildStorePlanPatch(body);
            await db
                .update(storeMarketingPlans)
                .set({
                    ...partial,
                    updatedAt: new Date(),
                })
                .where(eq(storeMarketingPlans.id, params.id));
            const [row] = await db
                .select()
                .from(storeMarketingPlans)
                .where(eq(storeMarketingPlans.id, params.id));
            return success(row);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                isActive: t.Optional(t.Boolean()),
                name: t.Optional(t.String()),
                description: t.Optional(t.String()),
                monthlyPrice: t.Optional(t.String()),
                benefits: t.Optional(t.Record(t.String(), t.Unknown())),
            }),
        }
    )

    .get("/store-subscriptions", async () => {
        const rows = await db
            .select({
                subscription: storeMarketingSubscriptions,
                plan: storeMarketingPlans,
            })
            .from(storeMarketingSubscriptions)
            .innerJoin(
                storeMarketingPlans,
                eq(storeMarketingSubscriptions.planId, storeMarketingPlans.id)
            )
            .limit(200);
        return success(rows);
    });
