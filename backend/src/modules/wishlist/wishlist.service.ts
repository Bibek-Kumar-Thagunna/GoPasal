import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateId } from "@/utils";

export class WishlistService {
    async toggleWishlist(userId: string, productId: string) {
        const [existing] = await db.select().from(wishlists)
            .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));

        if (existing) {
            await db.delete(wishlists).where(eq(wishlists.id, existing.id));
            return { added: false };
        } else {
            await db.insert(wishlists).values({
                id: generateId(),
                userId,
                productId
            });
            return { added: true };
        }
    }

    async listWishlist(userId: string) {
        return await db.query.wishlists.findMany({
            where: eq(wishlists.userId, userId),
            with: { 
                product: {
                    with: {
                        variants: true
                    }
                } 
            },
            orderBy: desc(wishlists.createdAt)
        });
    }
}

export const wishlistService = new WishlistService();
