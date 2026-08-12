import {
    pgTable,
    text,
    timestamp,
    varchar,
    integer,
    jsonb,
    index,
    pgEnum,
    decimal,
    boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { riders } from "./delivery";

export const riderTierEnum = pgEnum("rider_tier", [
    "BRONZE",
    "SILVER",
    "GOLD",
    "DIAMOND",
]);

export const masterMerchants = pgTable(
    "master_merchants",
    {
        id: text("id").primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        ownerId: text("owner_id")
            .references(() => users.id)
            .notNull(),
        branchIds: jsonb("branch_ids").$type<string[]>(), // Array of store IDs
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("idx_master_owner").on(table.ownerId)]
);

export const masterMerchantsRelations = relations(masterMerchants, ({ one }) => ({
    owner: one(users, {
        fields: [masterMerchants.ownerId],
        references: [users.id],
    }),
}));

export const riderTiers = pgTable(
    "rider_tiers",
    {
        id: text("id").primaryKey(),
        riderId: text("rider_id")
            .references(() => riders.id, { onDelete: "cascade" })
            .unique()
            .notNull(),
        tier: riderTierEnum("tier").default("BRONZE").notNull(),
        monthlyOrders: integer("monthly_orders").default(0),
        rating: integer("rating").default(500), // Internal score 0-1000
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("idx_rider_tiers_rider").on(table.riderId)]
);

export const riderTiersRelations = relations(riderTiers, ({ one }) => ({
    rider: one(riders, {
        fields: [riderTiers.riderId],
        references: [riders.id],
    }),
}));
// ... existing code

// --- Enterprise Catalog ---

export const masterProductTemplates = pgTable("master_product_templates", {
    id: text("id").primaryKey(),
    masterMerchantId: text("master_merchant_id").references(() => masterMerchants.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    categoryId: text("category_id").notNull(), // Loose reference or FK? FK to categories.
    images: jsonb("images").$type<string[]>(),
    zoneRates: jsonb("zone_rates").$type<Record<string, number>>(), // { "KTM-1": 120.00 }
    metadata: jsonb("metadata"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_templates_master").on(table.masterMerchantId)
]);

export const branchProductLinks = pgTable("branch_product_links", {
    branchStoreId: text("branch_store_id").notNull(), // FK stores.id managed in app or import
    templateId: text("template_id").references(() => masterProductTemplates.id, { onDelete: "cascade" }).notNull(),
    productId: text("product_id").notNull(), // FK products.id
    priceOverride: decimal("price_override", { precision: 10, scale: 2 }), // Nullable
    isLocalOverride: boolean("is_local_override").default(false).notNull(),
    isSynced: boolean("is_synced").default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_links_branch").on(table.branchStoreId),
    index("idx_links_template").on(table.templateId),
    // Composite PK?
    // pk(table.branchStoreId, table.templateId) // Not supported in all drizzle versions easily in single line, separate PK or id.
    // Let's use a composite PK definition if possible, or just unique index.
]);

// We need to import 'products', 'stores', 'categories' to make FKs work if we want strict DB FKs.
// But circular deps are annoying. For now, we keep loose refs or import carefully.
// `enterprise.ts` is imported by `index.ts`. `catalog.ts` is imported by `index.ts`.
// If we import `products` here, `catalog.ts` imports `stores`, `stores` imports `users`...
// `enterprise` imports `riders` (delivery), `users`.
// Adding `catalog` imports might cause cycle strictly if catalog imports enterprise (it doesn't yet).
