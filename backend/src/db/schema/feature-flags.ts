import {
    pgTable,
    text,
    boolean,
    timestamp,
    uniqueIndex,
    varchar,
    jsonb,
} from "drizzle-orm/pg-core";

export const featureFlags = pgTable(
    "feature_flags",
    {
        id: text("id").primaryKey(),
        key: varchar("key", { length: 100 }).notNull(),
        description: text("description"),
        isEnabled: boolean("is_enabled").default(false).notNull(),
        rules: jsonb("rules").$type<any[]>().default([]), // Targeting rules
        clientSide: boolean("client_side").default(false).notNull(), // Expose to frontend
        env: varchar("env", { length: 20 }).default("production").notNull(),
        tenantId: text("tenant_id"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex("idx_flag_key_env_tenant").on(
            table.key,
            table.env,
            table.tenantId
        ),
    ]
);
