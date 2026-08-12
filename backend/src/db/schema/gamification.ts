import {
    pgTable,
    text,
    timestamp,
    varchar,
    integer,
    decimal,
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { riders } from "./delivery";
import { stores } from "./stores";

// Enums
export const badgeTypeEnum = pgEnum("badge_type", [
    "FASTEST_PACKER",
    "TOP_RATED",
    "RELIABLE_STOCK",
    "CUSTOMER_FAVORITE",
]);

export const badgeWindowEnum = pgEnum("badge_window", [
    "WEEKLY",
    "MONTHLY",
]);

// --- Gamification & Retention ---

export const riderPerformanceMonthly = pgTable(
    "rider_performance_monthly",
    {
        id: text("id").primaryKey(),
        riderId: text("rider_id")
            .references(() => riders.id, { onDelete: "cascade" })
            .notNull(),
        yearMonth: varchar("year_month", { length: 7 }).notNull(), // "2026-02"

        // Metrics
        completedOrders: integer("completed_orders").default(0).notNull(),
        acceptanceRate: decimal("acceptance_rate", { precision: 5, scale: 2 }).default("0").notNull(), // 0-100
        cancellationRate: decimal("cancellation_rate", { precision: 5, scale: 2 }).default("0").notNull(), // 0-100
        avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default("0").notNull(), // 0-5
        onTimeRate: decimal("on_time_rate", { precision: 5, scale: 2 }).default("0").notNull(), // 0-100
        safetyFlags: integer("safety_flags").default(0).notNull(), // Speeding/Braking events

        computedAt: timestamp("computed_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_perf_rider").on(table.riderId),
        index("idx_perf_month").on(table.yearMonth),
        // unique constraint on rider+month?
        // uniqueIndex("uq_perf_rider_month").on(table.riderId, table.yearMonth) // Drizzle syntax varies, relying on app logic or separate migration
    ]
);

export const riderLeaderboards = pgTable(
    "rider_leaderboards",
    {
        id: text("id").primaryKey(),
        riderId: text("rider_id")
            .references(() => riders.id, { onDelete: "cascade" })
            .notNull(),
        yearMonth: varchar("year_month", { length: 7 }).notNull(),
        score: decimal("score", { precision: 10, scale: 2 }).notNull(),
        rank: integer("rank").notNull(),
        city: varchar("city", { length: 100 }), // Optional zoning
        computedAt: timestamp("computed_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_leaderboard_month").on(table.yearMonth),
        index("idx_leaderboard_rank").on(table.rank),
    ]
);

export const sellerBadges = pgTable(
    "seller_badges",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id, { onDelete: "cascade" })
            .notNull(),
        badgeType: badgeTypeEnum("badge_type").notNull(),
        window: badgeWindowEnum("window").default("WEEKLY").notNull(),
        scoreSnapshot: decimal("score_snapshot", { precision: 10, scale: 2 }),
        assignedAt: timestamp("assigned_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
    },
    (table) => [
        index("idx_badges_store").on(table.storeId),
        index("idx_badges_type").on(table.badgeType),
    ]
);

// Relations
export const riderPerformanceRelations = relations(riderPerformanceMonthly, ({ one }) => ({
    rider: one(riders, {
        fields: [riderPerformanceMonthly.riderId],
        references: [riders.id],
    }),
}));

export const riderLeaderboardRelations = relations(riderLeaderboards, ({ one }) => ({
    rider: one(riders, {
        fields: [riderLeaderboards.riderId],
        references: [riders.id],
    }),
}));

export const sellerBadgeRelations = relations(sellerBadges, ({ one }) => ({
    store: one(stores, {
        fields: [sellerBadges.storeId],
        references: [stores.id],
    }),
}));
