import {
    pgTable,
    text,
    timestamp,
    varchar,
    boolean,
    integer,
    decimal,
    jsonb,
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "EXPIRED", "CANCELLED", "PAYMENT_FAILED"]);
export const subscriptionEventTypeEnum = pgEnum("subscription_event_type", ["CREATED", "RENEWED", "CANCELLED", "FAILED", "EXPIRED"]);

export const subscriptionPlans = pgTable("subscription_plans", {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 60 }),
    /** Typed as CustomerPlanBenefits (JSON); delivery waivers & loyalty boosts. */
    benefits: jsonb("benefits").default({}).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    durationDays: integer("duration_days").notNull(),
    deliveryFreeThreshold: decimal("delivery_free_threshold", { precision: 10, scale: 2 }),
    isPriorityDelivery: boolean("is_priority_delivery").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id).notNull(), // One active sub per user ideally, but unique constraint handled in logic or index
    planId: text("plan_id").references(() => subscriptionPlans.id).notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    autoRenew: boolean("auto_renew").default(true),
    paymentTokenRef: text("payment_token_ref"), // Gateway token
    lastRenewalAttemptAt: timestamp("last_renewal_attempt_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => [
    index("idx_subs_user_status").on(table.userId, table.status),
    index("idx_subs_expiry").on(table.endAt)
]);

export const subscriptionEvents = pgTable("subscription_events", {
    id: text("id").primaryKey(),
    userSubscriptionId: text("user_subscription_id").references(() => userSubscriptions.id).notNull(),
    type: subscriptionEventTypeEnum("type").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Relations
export const userSubscriptionRelations = relations(userSubscriptions, ({ one, many }) => ({
    user: one(users, {
        fields: [userSubscriptions.userId],
        references: [users.id]
    }),
    plan: one(subscriptionPlans, {
        fields: [userSubscriptions.planId],
        references: [subscriptionPlans.id]
    }),
    events: many(subscriptionEvents)
}));

export const subscriptionEventRelations = relations(subscriptionEvents, ({ one }) => ({
    subscription: one(userSubscriptions, {
        fields: [subscriptionEvents.userSubscriptionId],
        references: [userSubscriptions.id]
    })
}));
