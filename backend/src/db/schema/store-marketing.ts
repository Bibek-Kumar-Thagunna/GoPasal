import {
    pgTable,
    text,
    timestamp,
    varchar,
    boolean,
    decimal,
    jsonb,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { subscriptionStatusEnum } from "./subscriptions";

/** Paid shop tiers (boosted placement, lower take-rate, promo credits — commercial analogue). */
export const storeMarketingPlans = pgTable(
    "store_marketing_plans",
    {
        id: text("id").primaryKey(),
        name: varchar("name", { length: 120 }).notNull(),
        slug: varchar("slug", { length: 60 }).notNull(),
        description: text("description"),
        monthlyPrice: decimal("monthly_price", { precision: 12, scale: 2 }).notNull(),
        benefits: jsonb("benefits").default({}).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [index("idx_store_marketing_plans_active").on(table.isActive, table.slug)]
);

export const storeMarketingSubscriptions = pgTable(
    "store_marketing_subscriptions",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id, { onDelete: "cascade" })
            .notNull(),
        planId: text("plan_id")
            .references(() => storeMarketingPlans.id)
            .notNull(),
        status: subscriptionStatusEnum("status").notNull(),
        startAt: timestamp("start_at", { withTimezone: true }).notNull(),
        endAt: timestamp("end_at", { withTimezone: true }).notNull(),
        autoRenew: boolean("auto_renew").default(true),
        paymentTokenRef: text("payment_token_ref"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_store_mkt_sub_store_status").on(table.storeId, table.status),
        index("idx_store_mkt_sub_end").on(table.endAt),
    ]
);

export const storeMarketingRelations = relations(storeMarketingPlans, ({ many }) => ({
    subscriptions: many(storeMarketingSubscriptions),
}));

export const storeMarketingSubRelations = relations(
    storeMarketingSubscriptions,
    ({ one }) => ({
        store: one(stores, {
            fields: [storeMarketingSubscriptions.storeId],
            references: [stores.id],
        }),
        plan: one(storeMarketingPlans, {
            fields: [storeMarketingSubscriptions.planId],
            references: [storeMarketingPlans.id],
        }),
    })
);
