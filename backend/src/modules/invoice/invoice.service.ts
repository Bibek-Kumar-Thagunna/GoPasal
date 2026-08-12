import { db, type DbTransaction } from "@/db";
import { invoices, invoiceLines, taxProfiles, orders, orderItems, stores } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { generateId } from "@/utils";
import { NotFoundError } from "@/utils/errors";
// ...

// Config
const PLATFORM_VAT_RATE = 13.00; // 13% for Nepal

export class InvoiceService {

    async listForSeller(sellerUserId: string) {
        const sellerStores = await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerId, sellerUserId));
        const storeIds = sellerStores.map((s) => s.id);
        if (storeIds.length === 0) return [];
        return db.select()
            .from(invoices)
            .where(inArray(invoices.storeId, storeIds))
            .orderBy(desc(invoices.createdAt));
    }

    async listByStoreId(storeId: string, limit = 80) {
        return db
            .select()
            .from(invoices)
            .where(eq(invoices.storeId, storeId))
            .orderBy(desc(invoices.createdAt))
            .limit(limit);
    }

    async getByOrderId(orderId: string, sellerUserId: string) {
        const [invoice] = await db.select()
            .from(invoices)
            .innerJoin(stores, eq(invoices.storeId, stores.id))
            .where(and(eq(invoices.orderId, orderId), eq(stores.ownerId, sellerUserId)));
        if (!invoice) throw new NotFoundError("Invoice not found");
        return invoice.invoices;
    }

    // 1. Generate Draft (Preview)
    async generateDraft(orderId: string) {
        // Fetch Order & Items
        const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
        if (!order) throw new NotFoundError("Order not found");

        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

        // Fetch Tax Profile
        // Platform Profile (Singleton logic needed, but for now just Seller)
        const [sellerProfile] = await db.select().from(taxProfiles).where(eq(taxProfiles.storeId, order.storeId));
        const sellerVatRegistered = sellerProfile?.isVatRegistered ?? false;
        const sellerVatRate = sellerVatRegistered ? 13.00 : 0;

        // Calculate Lines
        const lines: { description: string; quantity: number; unitPrice: number; total: number; type?: string; netAmount?: number; taxRate?: number; taxAmount?: number; grossAmount?: number }[] = [];
        let totalGoodsVat = 0;
        let totalServiceVat = 0;
        let subtotal = 0;
        let totalCross = 0;

        // A. Goods
        for (const item of items) {
            const price = Number(item.priceAtPurchase);
            const qty = item.quantity;
            const grossLine = price * qty;

            // Inclusive Pricing Assumption (Standard B2C)
            // Net = Gross / (1 + Rate)
            const netLine = Number((grossLine / (1 + sellerVatRate / 100)).toFixed(2));
            const vatLine = Number((grossLine - netLine).toFixed(2));

            lines.push({
                type: "GOODS",
                description: item.productName,
                quantity: qty,
                unitPrice: price,
                netAmount: netLine,
                taxRate: sellerVatRate,
                taxAmount: vatLine,
                total: grossLine,
                grossAmount: grossLine,
            });

            totalGoodsVat += vatLine;
            subtotal += netLine;
            totalCross += grossLine;
        }

        // B. Services (Delivery, Platform Checks)
        // Check Settlements/Order for fees (Assuming delivery fee integrated in totalAmount or fetched separately)
        // For MVP, if order.totalAmount > sum(items), diff is fee.
        const itemsTotal = items.reduce((acc, item) => acc + (Number(item.priceAtPurchase) * item.quantity), 0);
        const orderTotal = Number(order.totalAmount);
        const feeDiff = orderTotal - itemsTotal;

        if (feeDiff > 0) {
            // Platform/Delivery Fee (Platform VAT applies)
            const grossFee = feeDiff;
            const netFee = Number((grossFee / (1 + PLATFORM_VAT_RATE / 100)).toFixed(2));
            const vatFee = Number((grossFee - netFee).toFixed(2));

            lines.push({
                type: "PLATFORM_SERVICE", // Or Delivery
                description: "Service/Delivery Fee",
                quantity: 1,
                unitPrice: feeDiff,
                netAmount: netFee,
                taxRate: PLATFORM_VAT_RATE,
                taxAmount: vatFee,
                total: grossFee,
                grossAmount: grossFee,
            });

            totalServiceVat += vatFee;
            subtotal += netFee;
            totalCross += grossFee;
        }

        // Totals
        const totals = {
            subtotal: Number(subtotal.toFixed(2)),
            goodsVat: Number(totalGoodsVat.toFixed(2)),
            serviceVat: Number(totalServiceVat.toFixed(2)),
            totalTax: Number((totalGoodsVat + totalServiceVat).toFixed(2)),
            totalAmount: Number(totalCross.toFixed(2))
        };

        // Upsert Draft Invoice
        const invoiceId = generateId();
        // Check existing
        const [existing] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));

        if (existing && existing.status === "ISSUED") return existing; // Don't touch issued

        const invoiceData = {
            id: existing ? existing.id : invoiceId,
            orderId,
            storeId: order.storeId,
            invoiceNumber: existing ? existing.invoiceNumber : `DRAFT-${orderId}`,
            status: "DRAFT" as const,
            issueDate: new Date(),
            totals: totals,
            buyerDetails: { userId: order.userId } // Extend with real address logic
        };

        await db.transaction(async (tx: DbTransaction) => {
            if (existing) {
                await tx.update(invoices).set(invoiceData).where(eq(invoices.id, existing.id));
                await tx.delete(invoiceLines).where(eq(invoiceLines.invoiceId, existing.id));
            } else {
                await tx.insert(invoices).values(invoiceData);
            }

            for (const line of lines) {
                await tx.insert(invoiceLines).values({
                    id: generateId(),
                    invoiceId: invoiceData.id,
                    type: line.type as any,
                    description: line.description,
                    quantity: line.quantity,
                    unitPrice: String(line.unitPrice),
                    netAmount: String(line.netAmount),
                    taxRate: String(line.taxRate),
                    taxAmount: String(line.taxAmount),
                    grossAmount: String(line.grossAmount),
                });
            }
        });

        return invoiceData;
    }

    // 2. Issue Invoice (Finalize)
    async issueInvoice(orderId: string) {
        const draft = await this.generateDraft(orderId); // Refresh calculations
        if (draft.status === "ISSUED") return draft;

        const invoiceNumber = await this.generateInvoiceNumber(draft.storeId);

        await db.update(invoices)
            .set({
                status: "ISSUED",
                invoiceNumber: invoiceNumber, // Assign real number
                issueDate: new Date(),
                updatedAt: new Date()
            })
            .where(eq(invoices.id, draft.id));

        // Ledger Posting (Deferred to separate LedgerService or called here)
        // await this.postToLedger(draft);

        return { ...draft, status: "ISSUED", invoiceNumber };
    }

    // 3. Create Credit Note
    async createCreditNote(orderId: string, refundAmount: number) {
        let [original] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
        if (!original || original.status !== "ISSUED") {
            // Refunds must not fail because the invoice was never issued
            // (e.g. orders created before invoicing existed). Issue it now.
            const issued = await this.issueInvoice(orderId);
            original = issued as typeof original;
        }
        if (!original || original.status !== "ISSUED") {
            throw new Error("Cannot credit note non-issued invoice");
        }

        // Simple Proportion Logic for MVP
        // In real world, we pick specific lines.
        // Here we just reverse the whole or part.

        const creditData = {
            id: generateId(),
            orderId,
            storeId: original.storeId,
            invoiceNumber: `CN-${original.invoiceNumber}`,
            type: "CREDIT_NOTE" as const,
            status: "ISSUED" as const,
            issueDate: new Date(),
            totals: {
                totalAmount: -refundAmount,
                note: "Refund Processed"
            },
            buyerDetails: original.buyerDetails
        };

        await db.insert(invoices).values(creditData);
        // Add lines mapped to refund would go here
    }

    private async generateInvoiceNumber(storeId: string) {
        // Sequential per tenant
        // Mocking for MVP: Time-based or Random to safe complexity
        // Real implementation: Redis counter or SQL Count
        const count = await db.$count(invoices, eq(invoices.storeId, storeId));
        return `INV-${storeId.substring(0, 4)}-${String(count + 1).padStart(6, '0')}`;
    }
}

export const invoiceService = new InvoiceService();
