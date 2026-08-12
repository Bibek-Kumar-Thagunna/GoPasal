import {
    pgTable,
    text,
    timestamp,
    varchar,
    index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sessions = pgTable(
    "sessions",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        refreshToken: text("refresh_token").notNull(),
        deviceId: varchar("device_id", { length: 255 }),
        userAgent: text("user_agent"),
        ipAddress: varchar("ip_address", { length: 45 }),
        status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_sessions_user").on(table.userId),
        index("idx_sessions_refresh_token").on(table.refreshToken),
        index("idx_sessions_status").on(table.status),
    ]
);

export const otps = pgTable(
    "otps",
    {
        id: text("id").primaryKey(),
        phone: varchar("phone", { length: 20 }).notNull(),
        otpHash: text("otp_hash").notNull(),
        attempts: text("attempts").default("0").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        usedAt: timestamp("used_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_otps_phone").on(table.phone),
        index("idx_otps_expires").on(table.expiresAt),
    ]
);
