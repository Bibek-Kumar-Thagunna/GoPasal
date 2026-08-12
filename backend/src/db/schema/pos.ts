import {
    pgTable,
    text,
    timestamp,
    varchar,
    jsonb,
    index,
    pgEnum,
    integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { products, productVariants } from "./catalog";
import { orders } from "./orders";

// Enums
export const posProviderEnum = pgEnum("pos_provider", ["IMS", "SQUARE", "CLOVER", "CUSTOM"]);
export const posSyncStatusEnum = pgEnum("pos_sync_status", ["PENDING", "SYNCED", "FAILED", "RETRYING"]);
export const posSyncTypeEnum = pgEnum("pos_sync_type", ["MENU_PULL", "ORDER_PUSH", "INVENTORY_PUSH"]);
export const posIntegrationStatusEnum = pgEnum("pos_integration_status", ["ACTIVE", "PAUSED", "ERROR"]);

// 1. POS Integrations (Config)
export const posIntegrations = pgTable(
    "pos_integrations",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id, { onDelete: "cascade" })
            .notNull(),
        provider: posProviderEnum("provider").notNull(),
        config: text("config").notNull(), // Encrypted JSON string (apiKey, baseUrl, etc.)
        status: posIntegrationStatusEnum("status").default("ACTIVE").notNull(),
        lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_pos_integrations_store").on(table.storeId),
    ]
);

// 2. POS Product Mappings
export const posProductMappings = pgTable(
    "pos_product_mappings",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id, { onDelete: "cascade" })
            .notNull(),
        productId: text("product_id")
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        variantId: text("variant_id")
            .references(() => productVariants.id, { onDelete: "cascade" }), // Optional if simple product
        externalProductId: varchar("external_product_id", { length: 255 }).notNull(),
        externalVariantId: varchar("external_variant_id", { length: 255 }),
        lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_pos_map_store").on(table.storeId),
        index("idx_pos_map_product").on(table.productId),
        index("idx_pos_map_external").on(table.externalProductId),
    ]
);

// 3. POS Order Mappings
export const posOrderMappings = pgTable(
    "pos_order_mappings",
    {
        id: text("id").primaryKey(),
        orderId: text("order_id")
            .references(() => orders.id, { onDelete: "cascade" })
            .notNull(),
        externalOrderId: varchar("external_order_id", { length: 255 }),
        syncStatus: posSyncStatusEnum("sync_status").default("PENDING").notNull(),
        retryCount: integer("retry_count").default(0).notNull(),
        lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
        errorMessage: text("error_message"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_pos_order_map_order").on(table.orderId),
        index("idx_pos_order_map_external").on(table.externalOrderId),
    ]
);

// 4. POS Sync Logs (Audit)
export const posSyncLogs = pgTable(
    "pos_sync_logs",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id)
            .notNull(),
        type: posSyncTypeEnum("type").notNull(),
        status: posSyncStatusEnum("status").notNull(),
        payload: jsonb("payload"), // Sanitized payload snapshot
        errorMessage: text("error_message"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_pos_logs_store").on(table.storeId),
        index("idx_pos_logs_date").on(table.createdAt),
    ]
);

// Relations
export const posIntegrationsRelations = relations(posIntegrations, ({ one }) => ({
    store: one(stores, {
        fields: [posIntegrations.storeId],
        references: [stores.id],
    }),
}));

export const posProductMappingsRelations = relations(posProductMappings, ({ one }) => ({
    product: one(products, {
        fields: [posProductMappings.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [posProductMappings.variantId],
        references: [productVariants.id],
    }),
}));

export const posOrderMappingsRelations = relations(posOrderMappings, ({ one }) => ({
    order: one(orders, {
        fields: [posOrderMappings.orderId],
        references: [orders.id],
    }),
}));
