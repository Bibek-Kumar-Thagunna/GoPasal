import {
    pgTable,
    text,
    timestamp,
    varchar,
    decimal,
    boolean,
    integer,
    pgEnum,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const couponTypeEnum = pgEnum("coupon_type", ["FIXED", "PERCENT"]);
export const couponStatusEnum = pgEnum("coupon_status", ["ACTIVE", "PAUSED", "EXPIRED"]);
export const referralStatusEnum = pgEnum("referral_status", ["PENDING", "COMPLETED", "REWARDED", "INVALID"]);
export const loyaltyTypeEnum = pgEnum("loyalty_type", ["EARN", "REDEEM", "ADJUSTMENT"]);

// 1. Coupons
export const coupons = pgTable(
    "coupons",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id").notNull(), // Tenant scoped
        code: varchar("code", { length: 20 }).notNull(),
        type: couponTypeEnum("type").notNull(),
        value: decimal("value", { precision: 10, scale: 2 }).notNull(), // Amount or Percent
        minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }).default("0"),
        maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }), // Cap for percent
        requiresGold: boolean("requires_gold").default(false),
        startDate: timestamp("start_date", { withTimezone: true }).notNull(),
        endDate: timestamp("end_date", { withTimezone: true }).notNull(),
        usageLimitTotal: integer("usage_limit_total"),
        usageLimitPerUser: integer("usage_limit_per_user").default(1),
        usedCount: integer("used_count").default(0),
        status: couponStatusEnum("status").default("ACTIVE"),
        createdBy: text("created_by"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_coupon_code_store").on(table.code, table.storeId), // Unique per store
        index("idx_coupon_validity").on(table.startDate, table.endDate, table.status),
    ]
);

// 2. Coupon Redemptions
export const couponRedemptions = pgTable(
    "coupon_redemptions",
    {
        id: text("id").primaryKey(),
        couponId: text("coupon_id").notNull(),
        userId: text("user_id").notNull(),
        orderId: text("order_id").notNull(),
        discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_redemption_user").on(table.userId, table.couponId),
        index("idx_redemption_order").on(table.orderId),
    ]
);

// 3. Referral Codes
export const referralCodes = pgTable(
    "referral_codes",
    {
        userId: text("user_id").primaryKey(), // One code per user for now
        code: varchar("code", { length: 20 }).notNull().unique(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    }
);

// 4. Referral Rewards
export const referralRewards = pgTable(
    "referral_rewards",
    {
        id: text("id").primaryKey(),
        referrerId: text("referrer_id").notNull(),
        refereeId: text("referee_id").notNull(),
        status: referralStatusEnum("status").default("PENDING"),
        rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).notNull(),
        processedAt: timestamp("processed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_referral_referrer").on(table.referrerId),
        index("idx_referral_referee").on(table.refereeId),
    ]
);

// 5. Loyalty Ledger
export const loyaltyLedger = pgTable(
    "loyalty_ledger",
    {
        id: text("id").primaryKey(),
        userId: text("user_id").notNull(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // +/-
        type: loyaltyTypeEnum("type").notNull(),
        orderId: text("order_id"), // Nullable (for manual adjustment)
        balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        metadata: text("metadata"), // JSON stringified for simplicity or extra details
    },
    (table) => [
        index("idx_loyalty_ledger_user").on(table.userId),
        index("idx_loyalty_order").on(table.orderId),
    ]
);

// Relations
export const growthRelations = relations(coupons, ({ many }) => ({
    redemptions: many(couponRedemptions),
}));

export const redemptionRelations = relations(couponRedemptions, ({ one }) => ({
    coupon: one(coupons, {
        fields: [couponRedemptions.couponId],
        references: [coupons.id],
    }),
}));
