import {
    pgTable,
    text,
    timestamp,
    integer,
    boolean,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";
import { products } from "./catalog";
import { orders } from "./orders";

export const reviews = pgTable(
    "reviews",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        orderId: text("order_id")
            .references(() => orders.id)
            .notNull(),
        storeId: text("store_id")
            .references(() => stores.id)
            .notNull(),
        productId: text("product_id")
            .references(() => products.id)
            .notNull(),
        rating: integer("rating").notNull(), // 1-5
        comment: text("comment"),
        isVerifiedPurchase: boolean("is_verified_purchase")
            .default(true)
            .notNull(),
        // ─── Owner Reply ─────────────────────────────────────
        ownerReply: text("owner_reply"),
        ownerRepliedAt: timestamp("owner_replied_at", { withTimezone: true }),
        // ─── Admin Moderation ────────────────────────────────
        isModerated: boolean("is_moderated").default(false).notNull(),
        isHidden: boolean("is_hidden").default(false).notNull(),
        moderatorNote: text("moderator_note"),
        moderatedBy: text("moderated_by").references(() => users.id),
        moderatedAt: timestamp("moderated_at", { withTimezone: true }),
        // ─── Timestamps ──────────────────────────────────────
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_reviews_product").on(table.productId),
        index("idx_reviews_store").on(table.storeId),
        index("idx_reviews_user").on(table.userId),
        index("idx_reviews_order").on(table.orderId),
    ]
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [reviews.productId],
        references: [products.id],
    }),
    store: one(stores, {
        fields: [reviews.storeId],
        references: [stores.id],
    }),
    order: one(orders, {
        fields: [reviews.orderId],
        references: [orders.id],
    }),
}));

export const wishlists = pgTable(
    "wishlists",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        productId: text("product_id")
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("idx_wishlists_user").on(table.userId)]
);

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
    user: one(users, {
        fields: [wishlists.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [wishlists.productId],
        references: [products.id],
    }),
}));
