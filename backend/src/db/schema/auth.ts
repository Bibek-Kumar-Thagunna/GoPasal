import { pgTable, text, varchar, timestamp, jsonb, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const identityProviderEnum = pgEnum("identity_provider", ["GOOGLE", "APPLE", "FACEBOOK", "PHONE", "EMAIL"]);
export const authEventTypeEnum = pgEnum("auth_event_type", ["LOGIN", "LINK", "UNLINK", "biometric_challenge", "biometric_verify", "silent_verify"]);

export const userIdentities = pgTable("user_identities", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    provider: identityProviderEnum("provider").notNull(),
    providerId: text("provider_id").notNull(), // sub from OIDC
    email: varchar("email", { length: 255 }),
    metadata: jsonb("metadata"), // tokens, scopes
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_identities_user").on(table.userId),
    index("idx_identities_provider").on(table.provider, table.providerId)
]);

export const deviceCredentials = pgTable("device_credentials", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    deviceId: text("device_id").notNull(),
    publicKey: text("public_key").notNull(), // COSE Key
    counter: integer("counter").default(0).notNull(),
    transports: jsonb("transports"), // ['usb', 'nfc', 'ble', 'internal']
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    index("idx_device_creds_user").on(table.userId)
]);

export const authEvents = pgTable("auth_events", {
    id: text("id").primaryKey(),
    userId: text("user_id"), // Can be null if pre-login failure
    eventType: authEventTypeEnum("event_type").notNull(),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const userIdentitiesRelations = relations(userIdentities, ({ one }) => ({
    user: one(users, {
        fields: [userIdentities.userId],
        references: [users.id]
    })
}));

export const deviceCredentialsRelations = relations(deviceCredentials, ({ one }) => ({
    user: one(users, {
        fields: [deviceCredentials.userId],
        references: [users.id]
    })
}));
