import {
    pgTable,
    text,
    timestamp,
    varchar,
    decimal,
    index,
    pgEnum,
    jsonb,
    boolean,
    integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { stores } from "./stores";
import { orders } from "./orders";

// Enums
export const invoiceStatusEnum = pgEnum("invoice_status", [
    "DRAFT",
    "ISSUED",
    "VOID",
]);

export const invoiceTypeEnum = pgEnum("invoice_type", [
    "INVOICE",
    "CREDIT_NOTE",
]);

export const invoiceLineTypeEnum = pgEnum("invoice_line_type", [
    "GOODS",
    "PLATFORM_SERVICE",
    "DELIVERY_SERVICE",
    "DISCOUNT",
]);

// 1. Tax Profiles (Seller & Platform)
export const taxProfiles = pgTable(
    "tax_profiles",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id").references(() => stores.id), // Nullable for Platform
        legalName: varchar("legal_name", { length: 255 }).notNull(),
        vatNumber: varchar("vat_number", { length: 50 }),
        address: text("address").notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        isVatRegistered: boolean("is_vat_registered").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_tax_profiles_store").on(table.storeId),
    ]
);

// 2. Invoices
export const invoices = pgTable(
    "invoices",
    {
        id: text("id").primaryKey(),
        orderId: text("order_id")
            .references(() => orders.id)
            .notNull(),
        storeId: text("store_id")
            .references(() => stores.id)
            .notNull(),
        invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(), // Unique per tenant or global sequential
        type: invoiceTypeEnum("type").default("INVOICE").notNull(),
        status: invoiceStatusEnum("status").default("DRAFT").notNull(),
        issueDate: timestamp("issue_date", { withTimezone: true }),
        currency: varchar("currency", { length: 3 }).default("NPR").notNull(),

        // Snapshot Data (JSON for Immutability + Query Speed for Reports)
        buyerDetails: jsonb("buyer_details"), // Name, UserID, PAN (if B2B)
        totals: jsonb("totals"), // { subtotal, totalTax, totalAmount, goodsVat, serviceVat }

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_invoices_order").on(table.orderId),
        index("idx_invoices_store").on(table.storeId),
        index("idx_invoices_number").on(table.invoiceNumber),
        index("idx_invoices_status").on(table.status),
    ]
);

// 3. Invoice Lines
export const invoiceLines = pgTable(
    "invoice_lines",
    {
        id: text("id").primaryKey(),
        invoiceId: text("invoice_id")
            .references(() => invoices.id, { onDelete: "cascade" })
            .notNull(),
        type: invoiceLineTypeEnum("type").notNull(), // GOODS, SERVICE, etc.
        description: text("description").notNull(),
        quantity: integer("quantity").default(1).notNull(),
        unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),

        // Tax Calculation Snapshot
        netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),   // Amount before Tax
        taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),     // e.g. 13.00
        taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
        grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(), // Amount after Tax

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_invoice_lines_invoice").on(table.invoiceId),
    ]
);

// Relations
export const taxProfilesRelations = relations(taxProfiles, ({ one }) => ({
    store: one(stores, {
        fields: [taxProfiles.storeId],
        references: [stores.id],
    }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    order: one(orders, {
        fields: [invoices.orderId],
        references: [orders.id],
    }),
    store: one(stores, {
        fields: [invoices.storeId],
        references: [stores.id],
    }),
    lines: many(invoiceLines),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
    invoice: one(invoices, {
        fields: [invoiceLines.invoiceId],
        references: [invoices.id],
    }),
}));
