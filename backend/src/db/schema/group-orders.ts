import { pgTable, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { carts } from "./orders";

export const participantRoleEnum = pgEnum("participant_role", ["HOST", "MEMBER"]);
export const participantStatusEnum = pgEnum("participant_status", ["ACTIVE", "LEFT", "REMOVED"]);

export const cartParticipants = pgTable("cart_participants", {
    id: text("id").primaryKey(),
    cartId: text("cart_id").references(() => carts.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").references(() => users.id).notNull(),
    role: participantRoleEnum("role").default("MEMBER").notNull(),
    status: participantStatusEnum("status").default("ACTIVE").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_cp_cart").on(table.cartId),
    index("idx_cp_user").on(table.userId)
]);

export const cartParticipantsRelations = relations(cartParticipants, ({ one }) => ({
    cart: one(carts, {
        fields: [cartParticipants.cartId],
        references: [carts.id]
    }),
    user: one(users, {
        fields: [cartParticipants.userId],
        references: [users.id]
    })
}));
