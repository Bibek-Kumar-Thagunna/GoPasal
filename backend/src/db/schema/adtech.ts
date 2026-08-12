import {
    pgTable,
    text,
    timestamp,
    varchar,
    decimal,
    pgEnum,
    index,
    primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const campaignTypeEnum = pgEnum("campaign_type", ["SPONSORED_LISTING", "BANNER"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["ACTIVE", "PAUSED", "ENDED"]);
export const targetTypeEnum = pgEnum("target_type", ["KEYWORD", "CATEGORY", "PRODUCT"]);
export const pacingModeEnum = pgEnum("pacing_mode", ["STANDARD", "ACCELERATED"]);

// 1. Sponsored Campaigns
export const sponsoredCampaigns = pgTable(
    "sponsored_campaigns",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id").notNull(),
        name: varchar("name", { length: 255 }).notNull(),
        type: campaignTypeEnum("type").default("SPONSORED_LISTING").notNull(),
        status: campaignStatusEnum("status").default("ACTIVE").notNull(),
        dailyBudget: decimal("daily_budget", { precision: 10, scale: 2 }).notNull(),
        pacingMode: pacingModeEnum("pacing_mode").default("STANDARD"),
        startDate: timestamp("start_date", { withTimezone: true }).notNull(),
        endDate: timestamp("end_date", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_campaign_store").on(table.storeId),
        index("idx_campaign_status").on(table.status, table.startDate, table.endDate),
    ]
);

// 2. Sponsored Targets (Keywords/Categories)
export const sponsoredTargets = pgTable(
    "sponsored_targets",
    {
        id: text("id").primaryKey(),
        campaignId: text("campaign_id").notNull(),
        targetType: targetTypeEnum("target_type").notNull(),
        targetValue: varchar("target_value", { length: 255 }).notNull(), // "shoes" or category_id
        bidAmount: decimal("bid_amount", { precision: 10, scale: 2 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_target_lookup").on(table.targetType, table.targetValue),
        index("idx_target_campaign").on(table.campaignId),
    ]
);

// 3. Ad Impressions (Analytics)
export const adImpressions = pgTable(
    "ad_impressions",
    {
        id: text("id").primaryKey(),
        campaignId: text("campaign_id").notNull(),
        storeId: text("store_id").notNull(),
        targetId: text("target_id"),
        userId: text("user_id"), // Nullable
        cost: decimal("cost", { precision: 10, scale: 4 }).notNull(),
        placement: varchar("placement", { length: 50 }).default("SEARCH_LISTING"),
        servedAt: timestamp("served_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_impr_campaign").on(table.campaignId),
        index("idx_impr_time").on(table.servedAt),
    ]
);

// 4. Ad Spend Daily (Billing/Budgeting)
export const adSpendDaily = pgTable(
    "ad_spend_daily",
    {
        date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
        campaignId: text("campaign_id").notNull(),
        storeId: text("store_id").notNull(),
        totalSpend: decimal("total_spend", { precision: 10, scale: 4 }).default("0").notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.date, table.campaignId] }), // Composite PK
        index("idx_spend_campaign").on(table.campaignId),
    ]
);
// Relations
export const adTechRelations = relations(sponsoredCampaigns, ({ many }) => ({
    targets: many(sponsoredTargets),
    dailySpend: many(adSpendDaily),
}));

export const targetRelations = relations(sponsoredTargets, ({ one }) => ({
    campaign: one(sponsoredCampaigns, {
        fields: [sponsoredTargets.campaignId],
        references: [sponsoredCampaigns.id],
    }),
}));

export const spendRelations = relations(adSpendDaily, ({ one }) => ({
    campaign: one(sponsoredCampaigns, {
        fields: [adSpendDaily.campaignId],
        references: [sponsoredCampaigns.id],
    }),
}));
