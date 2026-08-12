import { db } from "@/db";
import { carts, cartParticipants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "@/utils/errors";

export class GroupCartService {
    async getCart(cartId: string) {
        const cart = await db.query.carts.findFirst({
            where: eq(carts.id, cartId),
            with: {
                items: {
                    with: {
                        variant: { with: { product: true } }
                    }
                }
            }
        });
        if (!cart) throw new NotFoundError("Cart not found");
        return cart;
    }

    async getParticipants(cartId: string) {
        const rows = await db
            .select({
                id: cartParticipants.id,
                userId: cartParticipants.userId,
                role: cartParticipants.role,
                status: cartParticipants.status,
                joinedAt: cartParticipants.joinedAt,
            })
            .from(cartParticipants)
            .where(eq(cartParticipants.cartId, cartId))
            .orderBy(cartParticipants.joinedAt);

        return rows.map((r) => ({ userId: r.userId, role: r.role, status: r.status, joinedAt: r.joinedAt }));
    }
}

export const groupCartService = new GroupCartService();
