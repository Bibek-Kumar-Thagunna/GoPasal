import {
    pgTable,
    text,
    timestamp,
    varchar,
    jsonb,
    index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const systemConfigs = pgTable(
    "system_configs",
    {
        key: varchar("key", { length: 100 }).primaryKey(),
        value: jsonb("value").notNull(),
        description: text("description"),
        updatedBy: text("updated_by")
            .references(() => users.id),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_sys_conf_key").on(table.key),
    ]
);
