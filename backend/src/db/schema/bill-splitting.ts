import { pgTable, text, decimal, pgEnum, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { users } from "./users";

export const splitStatusEnum = pgEnum("split_status", ["PENDING", "PAID"]);

export const groupOrderSplits = pgTable("group_order_splits", {
    id: text("id").primaryKey(),
    orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").references(() => users.id).notNull(),
    amountOwed: decimal("amount_owed", { precision: 10, scale: 2 }).notNull(),
    amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0").notNull(),
    status: splitStatusEnum("status").default("PENDING").notNull(),
    transactionRef: text("transaction_ref"), // Reference to payment transaction if relevant
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_splits_order").on(table.orderId),
    index("idx_splits_user").on(table.userId)
]);

export const groupOrderSplitsRelations = relations(groupOrderSplits, ({ one }) => ({
    order: one(orders, {
        fields: [groupOrderSplits.orderId],
        references: [orders.id]
    }),
    user: one(users, {
        fields: [groupOrderSplits.userId],
        references: [users.id]
    })
}));
