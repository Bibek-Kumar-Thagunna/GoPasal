import { db, type DbTransaction } from "@/db";
import { carts, cartParticipants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId, NotFoundError, ConflictError, ForbiddenError } from "@/utils";
import { nanoid } from "nanoid";

export class GroupCartService {

    // 1. Create Group Cart (Convert or New)
    async createGroupCart(userId: string, storeId: string) {
        // Check if user has existing cart for this store?
        // Reuse logic or create new.
        // Simplified: Create new Group Cart.

        const cartId = generateId();
        const shareCode = nanoid(6).toUpperCase(); // "GP-1234" style

        await db.transaction(async (tx: DbTransaction) => {
            await tx.insert(carts).values({
                id: cartId,
                userId, // Host
                storeId,
                type: "GROUP",
                status: "OPEN",
                shareCode
            });

            await tx.insert(cartParticipants).values({
                id: generateId(),
                cartId,
                userId,
                role: "HOST",
                status: "ACTIVE"
            });
        });

        return { cartId, shareCode };
    }

    // 2. Join Group Cart
    async joinGroupCart(userId: string, shareCode: string) {
        const [cart] = await db.select().from(carts).where(eq(carts.shareCode, shareCode.toUpperCase()));

        if (!cart) throw new NotFoundError("Cart not found");
        if (cart.status !== "OPEN") throw new ConflictError("Cart is locked or completed");

        // Check already joined
        const [existing] = await db.select().from(cartParticipants).where(
            and(eq(cartParticipants.cartId, cart.id), eq(cartParticipants.userId, userId))
        );

        if (existing) {
            if (existing.status !== "ACTIVE") {
                // Re-join
                await db.update(cartParticipants).set({ status: "ACTIVE" }).where(eq(cartParticipants.id, existing.id));
            }
            return { cartId: cart.id, message: "Already joined" };
        }

        await db.insert(cartParticipants).values({
            id: generateId(),
            cartId: cart.id,
            userId,
            role: "MEMBER",
            status: "ACTIVE"
        });

        return { cartId: cart.id, message: "Joined successfully" };
    }

    // 3. Lock Cart (Host Only)
    async lockCart(userId: string, cartId: string) {
        const [cart] = await db.select().from(carts).where(eq(carts.id, cartId));
        if (!cart) throw new NotFoundError("Cart");

        if (cart.userId !== userId) throw new ForbiddenError("Only host can lock cart");

        await db.update(carts).set({ status: "LOCKED", updatedAt: new Date() }).where(eq(carts.id, cartId));
        return { message: "Cart locked" };
    }

    // 4. Leave/Remove
    async removeParticipant(hostId: string, cartId: string, targetUserId: string) {
        const [cart] = await db.select().from(carts).where(eq(carts.id, cartId));
        if (!cart) throw new NotFoundError("Cart");

        if (cart.userId !== hostId) throw new ForbiddenError("Only host can remove participants");

        await db.update(cartParticipants)
            .set({ status: "REMOVED" })
            .where(and(eq(cartParticipants.cartId, cartId), eq(cartParticipants.userId, targetUserId)));

        return { message: "Participant removed" };
    }
}

export const groupCartService = new GroupCartService();
