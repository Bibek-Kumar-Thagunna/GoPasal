import {
    pgTable,
    text,
    timestamp,
    
    pgEnum,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";

export const staffRoleEnum = pgEnum("staff_role", [
    "MANAGER",
    "CASHIER",
    "PACKER",
    "DRIVER",
]);
export const staffStatusEnum = pgEnum("staff_status", [
    "INVITED",
    "ACTIVE",
    "INACTIVE",
]);

export const storeStaff = pgTable(
    "store_staff",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id, { onDelete: "cascade" })
            .notNull(),
        userId: text("user_id")
            .references(() => users.id)
            .notNull(),
        status: staffStatusEnum("status").default("INVITED").notNull(),
        invitedBy: text("invited_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_staff_store").on(table.storeId),
        index("idx_staff_user").on(table.userId),
    ]
);

export const storeStaffRoles = pgTable(
    "store_staff_roles",
    {
        id: text("id").primaryKey(),
        storeStaffId: text("store_staff_id")
            .references(() => storeStaff.id, { onDelete: "cascade" })
            .notNull(),
        role: staffRoleEnum("role").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex("store_staff_roles_staff_role_uq").on(
            table.storeStaffId,
            table.role
        ),
        index("idx_store_staff_roles_staff").on(table.storeStaffId),
    ]
);

export const storeStaffRelations = relations(storeStaff, ({ one, many }) => ({
    store: one(stores, {
        fields: [storeStaff.storeId],
        references: [stores.id],
    }),
    user: one(users, {
        fields: [storeStaff.userId],
        references: [users.id],
    }),
    roles: many(storeStaffRoles),
}));

export const storeStaffRolesRelations = relations(storeStaffRoles, ({ one }) => ({
    storeStaff: one(storeStaff, {
        fields: [storeStaffRoles.storeStaffId],
        references: [storeStaff.id],
    }),
}));

export type StaffRoleKind = (typeof staffRoleEnum.enumValues)[number];
