import { pgTable, text, decimal, pgEnum, timestamp, integer, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./catalog";

// Enums
export const recTypeEnum = pgEnum("rec_type", ["ALSO_BOUGHT", "SIMILAR", "COMPLEMENTARY"]);
export const trendPeriodEnum = pgEnum("trend_period", ["DAILY", "WEEKLY"]);

// Table: trending_products
// Caches top products based on sales velocity
export const trendingProducts = pgTable("trending_products", {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    score: decimal("score", { precision: 10, scale: 2 }).notNull(), // Sales count or velocity score
    period: trendPeriodEnum("period").default("WEEKLY").notNull(),
    rank: integer("rank").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_trend_period").on(table.period),
    index("idx_trend_rank").on(table.rank),
    unique("unq_trend_product_period").on(table.productId, table.period) // One entry per product per period
]);

// Table: product_recommendations
// Pre-calculated item-to-item recommendations (CF or Content-based)
export const productRecommendations = pgTable("product_recommendations", {
    id: text("id").primaryKey(),
    sourceProductId: text("source_product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    targetProductId: text("target_product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    score: decimal("score", { precision: 5, scale: 4 }).notNull(), // Similarity score (0.0 to 1.0)
    type: recTypeEnum("type").default("ALSO_BOUGHT").notNull(),
    algorithmVersion: text("algorithm_version").default("v1"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_rec_source").on(table.sourceProductId),
    unique("unq_rec_pair_type").on(table.sourceProductId, table.targetProductId, table.type)
]);

export const trendingProductsRelations = relations(trendingProducts, ({ one }) => ({
    product: one(products, {
        fields: [trendingProducts.productId],
        references: [products.id]
    })
}));

export const productRecommendationsRelations = relations(productRecommendations, ({ one }) => ({
    sourceProduct: one(products, {
        fields: [productRecommendations.sourceProductId],
        references: [products.id],
        relationName: "sourceProduct"
    }),
    targetProduct: one(products, {
        fields: [productRecommendations.targetProductId],
        references: [products.id],
        relationName: "targetProduct"
    })
}));
