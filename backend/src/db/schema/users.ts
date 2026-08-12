import {
    pgTable,
    text,
    timestamp,
    varchar,
    boolean,
    index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
    "users",
    {
        id: text("id").primaryKey(),
        phone: varchar("phone", { length: 20 }).unique().notNull(),
        name: varchar("name", { length: 255 }),
        email: varchar("email", { length: 255 }),
        passwordHash: text("password_hash"),
        avatarUrl: text("avatar_url"),
        googleId: text("google_id"),
        pushToken: text("push_token"),
        isActive: boolean("is_active").default(true).notNull(),
        isPhoneVerified: boolean("is_phone_verified").default(false).notNull(),
        preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"), // en, ne
        dataExportRequestedAt: timestamp("data_export_requested_at", { withTimezone: true }),
        deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft delete
        lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_users_phone").on(table.phone),
        index("idx_users_email").on(table.email),
    ]
);
