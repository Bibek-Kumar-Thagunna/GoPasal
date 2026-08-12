import { db } from "@/db";
import { carts, cartItems, products, productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/utils";
import {
    NotFoundError,
    ConflictError,
    ValidationError,
} from "@/utils/errors";

export class CartService {
    async getCart(userId: string) {
        const cart = await db.query.carts.findFirst({
            where: eq(carts.userId, userId),
            with: {
                store: true,
                items: {
                    with: {
                        variant: {
                            with: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });
        return cart || null;
    }

    async addItem(userId: string, variantId: string, quantity: number) {
        if (quantity <= 0) throw new ValidationError("Quantity must be positive");

        // 1. Get Variant & Product info to know the Store ID
        // 1. Get Variant
        const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
        if (!variant) {
            throw new NotFoundError("Product variant");
        }

        // 2. Get Product to know Store ID
        const [product] = await db.select().from(products).where(eq(products.id, variant.productId));
        if (!product) throw new NotFoundError("Product of variant not found");

        const storeId = product.storeId;

        // 2. Get or Create Cart
        let cart = await db.query.carts.findFirst({
            where: eq(carts.userId, userId),
        });

        if (cart) {
            if (cart.storeId !== storeId) {
                throw new ConflictError(
                    "Cart contains items from a different store. Clear cart first."
                );
            }
            // LOCK CHECK
            if (cart.status === "LOCKED" || cart.status === "COMPLETED") {
                throw new ConflictError("Cart is locked. Only Host can unlock or checkout.");
            }
        } else {
            const id = generateId();
            [cart] = await db
                .insert(carts)
                .values({ id, userId, storeId, type: "SINGLE", status: "OPEN" })
                .returning();
        }

        // 3. Add or Update Item
        const existingItem = await db.query.cartItems.findFirst({
            where: and(
                eq(cartItems.cartId, cart.id),
                eq(cartItems.variantId, variantId)
            ),
        });

        if (existingItem) {
            await db
                .update(cartItems)
                .set({
                    quantity: existingItem.quantity + quantity,
                    updatedAt: new Date(),
                    // We don't overwrite addedBy on update usually, or do we update "lastEditedBy"?
                    // For now, keep original addedBy logic or simple append.
                })
                .where(eq(cartItems.id, existingItem.id));
        } else {
            await db.insert(cartItems).values({
                id: generateId(),
                cartId: cart.id,
                variantId,
                quantity,
                addedBy: userId // Attribution
            });
        }

        return this.getCart(userId);
    }

    async updateItem(userId: string, itemId: string, quantity: number) {
        if (quantity <= 0) return this.removeItem(userId, itemId);

        const cart = await db.query.carts.findFirst({
            where: eq(carts.userId, userId),
        });
        if (!cart) throw new NotFoundError("Cart");

        const [updated] = await db
            .update(cartItems)
            .set({ quantity, updatedAt: new Date() })
            .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
            .returning();

        if (!updated) throw new NotFoundError("Cart item");

        return this.getCart(userId);
    }

    async removeItem(userId: string, itemId: string) {
        const cart = await db.query.carts.findFirst({
            where: eq(carts.userId, userId),
        });
        if (!cart) throw new NotFoundError("Cart");

        await db
            .delete(cartItems)
            .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));

        // If cart is empty, delete the cart itself to free up store lock?
        // SRS says "persistent cart", usually we keep empty cart or delete it.
        // For now, let's keep it, but maybe auto-delete if empty to allow switching stores easier?
        // Let's check remaining items.
        const remaining = await db
            .select()
            .from(cartItems)
            .where(eq(cartItems.cartId, cart.id));

        if (remaining.length === 0) {
            await db.delete(carts).where(eq(carts.id, cart.id));
            return null; // Cart gone
        }

        return this.getCart(userId);
    }

    async clearCart(userId: string) {
        await db.delete(carts).where(eq(carts.userId, userId));
        return { message: "Cart cleared" };
    }
}
export const cartService = new CartService();
