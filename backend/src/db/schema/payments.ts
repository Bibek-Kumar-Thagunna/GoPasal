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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { stores } from "./stores";

// Enums
export const paymentStatusEnum = pgEnum("payment_status", [
    "PENDING",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
]);

export const paymentMethodEnum = pgEnum("payment_method_type", [
    "COD",
    "ESEWA",
    "KHALTI",
]);

export const escrowStatusEnum = pgEnum("escrow_status", [
    "HELD",
    "RELEASED",
    "REFUNDED",
]);

export const settlementStatusEnum = pgEnum("settlement_status", [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]);

export const refundStatusEnum = pgEnum("refund_status", [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
]);

export const refundTypeEnum = pgEnum("refund_type", [
    "FULL",
    "PARTIAL",
    "STORE_CREDIT",
]);

// --- Payments ---

export const payments = pgTable(
    "payments",
    {
        id: text("id").primaryKey(),
        orderId: text("order_id")
            .references(() => orders.id)
            .notNull(),
        method: paymentMethodEnum("method").notNull(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        status: paymentStatusEnum("status").default("PENDING").notNull(),
        gatewayRef: text("gateway_ref"), // eSewa/Khalti transaction ID
        idempotencyKey: text("idempotency_key"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_payments_order").on(table.orderId),
        index("idx_payments_status").on(table.status),
        index("idx_payments_idem").on(table.idempotencyKey),
    ]
);

export const paymentsRelations = relations(payments, ({ one, many }) => ({
    order: one(orders, {
        fields: [payments.orderId],
        references: [orders.id],
    }),
    escrow: one(escrow, {
        fields: [payments.id],
        references: [escrow.paymentId],
    }),
    refunds: many(refunds),
}));

// --- Escrow ---

export const escrow = pgTable(
    "escrow",
    {
        id: text("id").primaryKey(),
        paymentId: text("payment_id")
            .references(() => payments.id), // Nullable for COD (maybe? or link to cod_record? Prompt says source=COD/ONLINE. If COD, paymentId might be null if using cod_records)
        // Correction: Prompt 11/12 implies Payment Record for Online, COD Record for Cash.
        // Let's keep paymentId nullable or create a generic reference.
        // Actually simplest is: If COD, paymentId is null, use deliveryTaskId? 
        // Or just store order_id which is enough.
        orderId: text("order_id")
            .references(() => orders.id)
            .notNull(),
        tenantId: text("tenant_id")
            .references(() => stores.id), // Link to seller/store
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        status: escrowStatusEnum("status").default("HELD").notNull(),
        ledgerJournalId: text("ledger_journal_id"), // Reference to the Journal Entry
        settlementId: text("settlement_id"), // Link to Settlement Cycle
        releasedAt: timestamp("released_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_escrow_payment").on(table.paymentId),
        index("idx_escrow_order").on(table.orderId),
        index("idx_escrow_tenant").on(table.tenantId),
        index("idx_escrow_settlement").on(table.settlementId),
    ]
);

export const escrowRelations = relations(escrow, ({ one }) => ({
    payment: one(payments, {
        fields: [escrow.paymentId],
        references: [payments.id],
    }),
    settlement: one(settlements, {
        fields: [escrow.settlementId],
        references: [settlements.id],
    }),
}));

// --- Settlements ---

export const settlementItems = pgTable(
    "settlement_items",
    {
        id: text("id").primaryKey(),
        settlementId: text("settlement_id")
            .references(() => settlements.id)
            .notNull(),
        escrowId: text("escrow_id")
            .references(() => escrow.id)
            .notNull(),
        orderId: text("order_id").notNull(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Net Amount
        fee: decimal("fee", { precision: 10, scale: 2 }).notNull(), // Platform Fee
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_settlement_items_cycle").on(table.settlementId),
    ]
);

export const settlements = pgTable(
    "settlements",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .references(() => stores.id)
            .notNull(),
        periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
        periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
        grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(),
        commissionAmount: decimal("commission_amount", {
            precision: 10,
            scale: 2,
        }).notNull(),
        deliveryFees: decimal("delivery_fees", {
            precision: 10,
            scale: 2,
        }).default("0"),
        refundAdjustments: decimal("refund_adjustments", {
            precision: 10,
            scale: 2,
        }).default("0"),
        netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
        status: settlementStatusEnum("status").default("PENDING").notNull(),
        transactionRef: text("transaction_ref"), // Bank transfer ref
        executedAt: timestamp("executed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_settlements_store").on(table.storeId),
        index("idx_settlements_status").on(table.status),
    ]
);

export const settlementsRelations = relations(settlements, ({ one }) => ({
    store: one(stores, {
        fields: [settlements.storeId],
        references: [stores.id],
    }),
}));

// --- Ledger (Double Entry) ---

export const ledgerAccounts = pgTable(
    "ledger_accounts",
    {
        id: text("id").primaryKey(),
        tenantId: text("tenant_id"), // Null for Platform Accounts
        name: varchar("name", { length: 100 }).notNull(), // ASSET:CASH_ON_HAND, LIABILITY:ESCROW_HOLD
        type: varchar("type", { length: 50 }).notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
        description: text("description"),
        balance: decimal("balance", { precision: 12, scale: 2 }).default("0"), // Cached balance
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_ledger_accounts_tenant").on(table.tenantId),
        index("idx_ledger_accounts_name").on(table.name),
    ]
);

export const ledgerEntries = pgTable(
    "ledger_entries",
    {
        id: text("id").primaryKey(),
        journalId: text("journal_id").notNull(), // Grouping ID for double-entry
        accountId: text("account_id")
            .references(() => ledgerAccounts.id)
            .notNull(),
        referenceType: varchar("ref_type", { length: 50 }).notNull(), // ORDER, REFUND, SETTLEMENT, FEE
        referenceId: text("ref_id").notNull(),
        description: text("description"),
        type: varchar("type", { length: 10 }).notNull(), // DEBIT or CREDIT
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        idempotencyKey: text("idempotency_key"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_ledger_ref").on(table.referenceType, table.referenceId),
        index("idx_ledger_account").on(table.accountId),
        index("idx_ledger_journal").on(table.journalId),
        index("idx_ledger_idem").on(table.idempotencyKey),
    ]
);

export const paymentRecords = pgTable(
    "payment_records",
    {
        id: text("id").primaryKey(),
        paymentId: text("payment_id")
            .references(() => payments.id)
            .notNull(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        status: varchar("status", { length: 20 }).notNull(), // CAPTURED, FAILED
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    }
);

export const codRecords = pgTable(
    "cod_records",
    {
        id: text("id").primaryKey(),
        deliveryTaskId: text("delivery_task_id").notNull(),
        orderId: text("order_id").notNull(),
        riderId: text("rider_id").notNull(),
        expectedAmount: decimal("expected_amount", { precision: 10, scale: 2 }).notNull(),
        collectedAmount: decimal("collected_amount", { precision: 10, scale: 2 }).notNull(),
        status: varchar("status", { length: 20 }).notNull(), // MATCH, MISMATCH
        isReconciled: boolean("is_reconciled").default(false),
        reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_cod_rider").on(table.riderId),
        index("idx_cod_task").on(table.deliveryTaskId),
    ]
);

// --- Refunds ---

export const refunds = pgTable(
    "refunds",
    {
        id: text("id").primaryKey(),
        orderId: text("order_id")
            .references(() => orders.id)
            .notNull(),
        paymentId: text("payment_id").references(() => payments.id),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        type: refundTypeEnum("type").default("FULL").notNull(),
        status: refundStatusEnum("status").default("PENDING").notNull(),
        reason: text("reason"),
        processedAt: timestamp("processed_at", { withTimezone: true }),
        ledgerJournalId: text("ledger_journal_id"), // Linked Ledger Entry
        escrowId: text("escrow_id"), // Linked Escrow Record
        metadata: jsonb("metadata"), // For storing specific reason codes or admin notes
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("idx_refunds_order").on(table.orderId),
        index("idx_refunds_status").on(table.status),
    ]
);

export const refundsRelations = relations(refunds, ({ one }) => ({
    order: one(orders, {
        fields: [refunds.orderId],
        references: [orders.id],
    }),
    payment: one(payments, {
        fields: [refunds.paymentId],
        references: [payments.id],
    }),
}));
