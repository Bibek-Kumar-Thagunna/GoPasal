import {
    pgTable,
    text,
    timestamp,
    varchar,
    primaryKey,
    index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const roles = pgTable("roles", {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const permissions = pgTable("permissions", {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    resource: varchar("resource", { length: 100 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const rolePermissions = pgTable(
    "role_permissions",
    {
        roleId: text("role_id")
            .references(() => roles.id, { onDelete: "cascade" })
            .notNull(),
        permissionId: text("permission_id")
            .references(() => permissions.id, { onDelete: "cascade" })
            .notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.roleId, table.permissionId] }),
        index("idx_role_permissions_role").on(table.roleId),
    ]
);

export const userRoles = pgTable(
    "user_roles",
    {
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        roleId: text("role_id")
            .references(() => roles.id, { onDelete: "cascade" })
            .notNull(),
        tenantId: text("tenant_id"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.userId, table.roleId] }),
        index("idx_user_roles_user").on(table.userId),
        index("idx_user_roles_tenant").on(table.tenantId),
    ]
);
