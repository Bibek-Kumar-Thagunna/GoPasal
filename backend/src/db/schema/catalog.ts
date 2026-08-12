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
    
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { cartItems, orderItems } from "./orders";

export const categories = pgTable(
    "categories",
    {
        id: text("id").primaryKey(),
        name: varchar("name", { length: 100 }).notNull(),
        slug: varchar("slug", { length: 150 }).unique().notNull(),
        description: text("description"),
        parentId: text("parent_id"), // Self-reference handling in code or separate FK if needed
        image: text("image_url"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_categories_slug").on(table.slug),
        index("idx_categories_parent").on(table.parentId),
    ]
);

export const categoriesRelations = relations(categories, ({ many }) => ({
    products: many(products),
}));

export const products = pgTable(
    "products",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id, { onDelete: "cascade" })
            .notNull(),
        categoryId: text("category_id")
            .references(() => categories.id)
            .notNull(),
        name: varchar("name", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 300 }).notNull(), // Unique per store? or globally? Making it unique per store in code, or globally unique with suffix.
        description: text("description"),
        images: jsonb("images").$type<string[]>(), // Array of image URLs
        basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
        compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }), // Original price, for calculating discount/offer
        isActive: boolean("is_active").default(true).notNull(),
        isDeliverable: boolean("is_deliverable").default(true).notNull(), // True = ships, False = pickup only
        isArchived: boolean("is_archived").default(false).notNull(),
        metadata: jsonb("metadata"),
        dynamicAttributes: jsonb("dynamic_attributes"), // Category-specific fields (restaurant: modifiers, apparel: sizes/colors)
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_products_store").on(table.storeId),
        index("idx_products_category").on(table.categoryId),
        index("idx_products_search").on(table.name),
    ]
);

export const productsRelations = relations(products, ({ one, many }) => ({
    store: one(stores, {
        fields: [products.storeId],
        references: [stores.id],
    }),
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    variants: many(productVariants),
}));

export const productVariants = pgTable(
    "product_variants",
    {
        id: text("id").primaryKey(),
        productId: text("product_id")
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        name: varchar("name", { length: 255 }).notNull(), // e.g., "Size: M, Color: Red"
        sku: varchar("sku", { length: 100 }),
        priceOffset: decimal("price_offset", { precision: 10, scale: 2 }).default(
            "0"
        ), // Adjustment from base price
        attributes: jsonb("attributes"), // { size: "M", color: "Red" }
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("idx_variants_product").on(table.productId)]
);

export const productVariantsRelations = relations(
    productVariants,
    ({ one, many }) => ({
        product: one(products, {
            fields: [productVariants.productId],
            references: [products.id],
        }),
        inventory: one(inventory, {
            fields: [productVariants.id],
            references: [inventory.variantId], // Inventory links back to variant
        }),
        cartItems: many(cartItems),
        orderItems: many(orderItems),
    })
);

export const inventory = pgTable(
    "inventory",
    {
        id: text("id").primaryKey(),
        variantId: text("variant_id")
            .references(() => productVariants.id, { onDelete: "cascade" })
            .notNull(),
        quantity: integer("quantity").default(0).notNull(),
        lowStockThreshold: integer("low_stock_threshold").default(5),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("idx_inventory_variant").on(table.variantId)]
);

export const inventoryRelations = relations(inventory, ({ one }) => ({
    variant: one(productVariants, {
        fields: [inventory.variantId],
        references: [productVariants.id],
    }),
}));
