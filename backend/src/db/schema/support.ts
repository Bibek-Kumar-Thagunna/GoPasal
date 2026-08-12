import { pgTable, text, timestamp, varchar, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { orders } from "./orders";

export const conversationStatusEnum = pgEnum("conversation_status", [
    "BOT_ACTIVE",
    "HUMAN_PENDING",
    "HUMAN_ACTIVE",
    "CLOSED"
]);

export const messageSenderEnum = pgEnum("message_sender", ["USER", "BOT", "AGENT"]);

export const actionTypeEnum = pgEnum("support_action_type", [
    "FETCH_ORDER_STATUS",
    "ISSUE_WALLET_CREDIT",
    "CREATE_TICKET",
    "ESCALATE"
]);

export const actionStatusEnum = pgEnum("support_action_status", [
    "REQUESTED",
    "APPROVED",
    "EXECUTED",
    "FAILED"
]);

// A) Support Conversation
export const supportConversations = pgTable("support_conversations", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id).notNull(),
    orderId: text("order_id").references(() => orders.id), // Optional context
    channel: varchar("channel", { length: 50 }).default("IN_APP").notNull(),
    status: conversationStatusEnum("status").default("BOT_ACTIVE").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_support_conv_user").on(table.userId),
    index("idx_support_conv_status").on(table.status)
]);

// B) Support Message
export const supportMessages = pgTable("support_messages", {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").references(() => supportConversations.id).notNull(),
    sender: messageSenderEnum("sender").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"), // Intent, confidence
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_support_msg_conv").on(table.conversationId)
]);

// C) Support Action (Audit Log)
export const supportActions = pgTable("support_actions", {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").references(() => supportConversations.id).notNull(),
    actionType: actionTypeEnum("action_type").notNull(),
    status: actionStatusEnum("status").default("REQUESTED").notNull(),
    payload: jsonb("payload"),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
