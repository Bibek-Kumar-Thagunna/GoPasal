import {
    pgTable,
    text,
    timestamp,
    varchar,
    pgEnum,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";

export const announcementScopeEnum = pgEnum("announcement_scope", [
    "SINGLE_STORE",
    "ALL_BRANCHES",
]);

export const sellerAnnouncements = pgTable(
    "seller_announcements",
    {
        id: text("id").primaryKey(),
        authorId: text("author_id")
            .references(() => users.id)
            .notNull(),
        rootStoreId: text("root_store_id")
            .references(() => stores.id, { onDelete: "cascade" })
            .notNull(),
        scope: announcementScopeEnum("scope").notNull(),
        targetStoreId: text("target_store_id").references(() => stores.id, {
            onDelete: "cascade",
        }),
        title: varchar("title", { length: 200 }).notNull(),
        body: text("body").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_seller_ann_root").on(table.rootStoreId),
        index("idx_seller_ann_target").on(table.targetStoreId),
    ]
);

export const sellerAnnouncementsRelations = relations(
    sellerAnnouncements,
    ({ one }) => ({
        author: one(users, {
            fields: [sellerAnnouncements.authorId],
            references: [users.id],
        }),
        rootStore: one(stores, {
            fields: [sellerAnnouncements.rootStoreId],
            references: [stores.id],
        }),
        targetStore: one(stores, {
            fields: [sellerAnnouncements.targetStoreId],
            references: [stores.id],
        }),
    })
);
