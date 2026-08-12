import {
    pgTable,
    text,
    boolean,
    timestamp,
    varchar,
    index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notifications = pgTable(
    "notifications",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        message: text("message").notNull(),
        type: varchar("type", { length: 50 }).default("INFO"), // ORDER_UPDATE, SYSTEM, PROMO
        isRead: boolean("is_read").default(false).notNull(),
        metadata: text("metadata"), // JSON string
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_notif_user").on(table.userId),
        index("idx_notif_unread").on(table.userId, table.isRead),
    ]
);
