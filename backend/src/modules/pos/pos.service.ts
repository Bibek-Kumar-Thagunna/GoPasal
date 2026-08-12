import { db, type DbTransaction } from "@/db";
import { posIntegrations, posProductMappings, posOrderMappings, posSyncLogs, orders, orderItems, products, inventory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/utils";
import { NotFoundError } from "@/utils/errors";

// --- Types ---
interface PosAdapter {
    pushOrder(config: string, order: any, items: any[]): Promise<{ externalOrderId: string; status: "ACCEPTED" | "REJECTED" }>;
    pullMenu(config: string): Promise<Array<{ externalId: string; price: number; stock: number; active: boolean }>>;
}

// --- Adapters ---
class ImsAdapter implements PosAdapter {
    async pushOrder(_config: string, order: any, _items: any[]) {
        // Mock External Call
        console.log(`[IMS] Pushing order ${order.id} with config...`);
        // Simulate Success
        return { externalOrderId: `IMS-${order.id}`, status: "ACCEPTED" as const };
    }

    async pullMenu(_config: string) {
        // Mock External Call
        return [
            { externalId: "EXT-123", price: 150, stock: 50, active: true }, // Mock update
            { externalId: "EXT-OUT", price: 200, stock: 0, active: true },
        ];
    }
}

// --- Service ---
export class PosService {
    private adapters: Record<string, PosAdapter> = {
        "IMS": new ImsAdapter(),
        "CUSTOM": new ImsAdapter(), // Fallback
    };

    private getAdapter(provider: string): PosAdapter {
        return this.adapters[provider] || this.adapters["CUSTOM"];
    }

    // 1. Order Push
    async pushOrderToPos(orderId: string) {
        // A. Get Order & Items
        const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
        if (!order) throw new NotFoundError("Order not found");

        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

        // B. Check Integration
        const [integration] = await db.select().from(posIntegrations).where(eq(posIntegrations.storeId, order.storeId));
        if (!integration || integration.status !== "ACTIVE") return; // No active POS

        // C. Map Items
        // In real app, we map using posProductMappings. For MVP, we pass internal IDs if mappings missing or assume mock.

        try {
            const adapter = this.getAdapter(integration.provider);
            const response = await adapter.pushOrder(integration.config, order, items);

            if (response.status === "ACCEPTED") {
                await db.insert(posOrderMappings).values({
                    id: generateId(),
                    orderId,
                    externalOrderId: response.externalOrderId,
                    syncStatus: "SYNCED"
                });
            } else {
                // Handle Rejection
                await this.logSync(order.storeId, "ORDER_PUSH", "FAILED", { orderId }, "POS Rejected");
            }

            await this.logSync(order.storeId, "ORDER_PUSH", "SYNCED", { orderId, externalId: response.externalOrderId });

        } catch (error: any) {
            await this.logSync(order.storeId, "ORDER_PUSH", "FAILED", { orderId }, error.message);
            // Retry logic would go here (Queue)
        }
    }

    // 2. Menu Sync (Pull)
    async syncMenu(storeId: string) {
        const [integration] = await db.select().from(posIntegrations).where(eq(posIntegrations.storeId, storeId));
        if (!integration || integration.status !== "ACTIVE") return;

        try {
            const adapter = this.getAdapter(integration.provider);
            const externalItems = await adapter.pullMenu(integration.config);

            await db.transaction(async (tx: DbTransaction) => {
                for (const item of externalItems) {
                    // Find Mapping
                    const [mapping] = await tx.select().from(posProductMappings)
                        .where(and(
                            eq(posProductMappings.storeId, storeId),
                            eq(posProductMappings.externalProductId, item.externalId)
                        ));

                    if (mapping) {
                        // Update Price
                        if (mapping.productId) {
                            await tx.update(products)
                                .set({ basePrice: String(item.price), updatedAt: new Date() })
                                .where(eq(products.id, mapping.productId));
                        }

                        // Update Stock
                        if (mapping.variantId) {
                            await tx.update(inventory)
                                .set({ quantity: item.stock, updatedAt: new Date() })
                                .where(eq(inventory.variantId, mapping.variantId));
                        }
                    }
                }

                // Update Last Sync
                await tx.update(posIntegrations).set({ lastSyncAt: new Date() }).where(eq(posIntegrations.id, integration.id));
            });

            await this.logSync(storeId, "MENU_PULL", "SYNCED", { itemCount: externalItems.length });

        } catch (error: any) {
            await this.logSync(storeId, "MENU_PULL", "FAILED", {}, error.message);
        }
    }

    private async logSync(storeId: string, type: any, status: any, payload: any, error?: string) {
        await db.insert(posSyncLogs).values({
            id: generateId(),
            storeId,
            type,
            status,
            payload,
            errorMessage: error
        });
    }
}

export const posService = new PosService();
