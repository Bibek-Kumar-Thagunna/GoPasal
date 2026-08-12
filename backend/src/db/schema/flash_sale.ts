import {
    pgTable,
    text,
    timestamp,
    varchar,
    integer,
    
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productVariants } from "./catalog";

export const flashSaleStatusEnum = pgEnum("flash_sale_status", [
    "SCHEDULED",
    "ACTIVE",
    "ENDED",
    "CANCELLED",
]);

export const hotItemStatusEnum = pgEnum("hot_item_status", [
    "ACTIVE",
    "DISABLED",
    "SOLD_OUT",
]);

export const flashSaleEvents = pgTable(
    "flash_sale_events",
    {
        id: text("id").primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        startAt: timestamp("start_at", { withTimezone: true }).notNull(),
        endAt: timestamp("end_at", { withTimezone: true }).notNull(),
        status: flashSaleStatusEnum("status").default("SCHEDULED").notNull(),
        maxRps: integer("max_rps").default(100).notNull(), // Threshold for waiting room
        strictRateLimitProfileId: text("strict_rate_limit_profile_id"), // Config reference
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_fs_status").on(table.status),
        index("idx_fs_time").on(table.startAt, table.endAt),
    ]
);

export const hotItemConfig = pgTable(
    "hot_item_config",
    {
        id: text("id").primaryKey(),
        eventId: text("event_id")
            .references(() => flashSaleEvents.id, { onDelete: "cascade" })
            .notNull(),
        variantId: text("variant_id")
            .references(() => productVariants.id)
            .notNull(),
        // We link to variant, but typically need to lock store context too. 
        // Assuming variant implies store.
        initialStock: integer("initial_stock").notNull(),
        shardCount: integer("shard_count").default(16).notNull(), // Redis shards
        reservedStock: integer("reserved_stock").default(0).notNull(), // Sync back counter
        oversellBuffer: integer("oversell_buffer").default(0).notNull(),
        status: hotItemStatusEnum("status").default("ACTIVE").notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_hot_event").on(table.eventId),
        index("idx_hot_variant").on(table.variantId),
    ]
);

export const flashSaleRelations = relations(flashSaleEvents, ({ many }) => ({
    items: many(hotItemConfig),
}));

export const hotItemRelations = relations(hotItemConfig, ({ one }) => ({
    event: one(flashSaleEvents, {
        fields: [hotItemConfig.eventId],
        references: [flashSaleEvents.id],
    }),
    variant: one(productVariants, {
        fields: [hotItemConfig.variantId],
        references: [productVariants.id],
    }),
}));
