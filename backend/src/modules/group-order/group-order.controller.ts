import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { db } from "@/db";
import { carts, cartItems, cartParticipants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId, NotFoundError, ConflictError, ForbiddenError } from "@/utils";
import { success } from "@/utils/response";

/**
 * Group ordering: a host converts their cart into a shared group cart, then
 * invites friends with a share code. The order is placed via the normal
 * checkout (bill splitting is handled by `bill-split.service`).
 */
function inviteCodeFor(cartId: string): string {
    const raw = Buffer.from(cartId).toString("base64url").slice(0, 8).toUpperCase();
    return `GP-${raw}`;
}

async function ensureParticipant(cartId: string, userId: string) {
    const [row] = await db
        .select()
        .from(cartParticipants)
        .where(
            and(
                eq(cartParticipants.cartId, cartId),
                eq(cartParticipants.userId, userId),
                eq(cartParticipants.status, "ACTIVE")
            )
        )
        .limit(1);
    return row;
}

export const groupOrderController = new Elysia({ prefix: "/api/v1/group-orders" })
    .use(requireAuth())

    // Host creates (or converts) a group cart from their current cart.
    .post(
        "/",
        async ({ auth }) => {
            const [cart] = await db
                .select()
                .from(carts)
                .where(eq(carts.userId, auth.userId))
                .limit(1);
            if (!cart) throw new NotFoundError("You do not have an active cart");

            await db
                .update(carts)
                .set({ type: "GROUP", updatedAt: new Date() })
                .where(eq(carts.id, cart.id));

            const [existing] = await db
                .select()
                .from(cartParticipants)
                .where(
                    and(
                        eq(cartParticipants.cartId, cart.id),
                        eq(cartParticipants.userId, auth.userId)
                    )
                )
                .limit(1);
            if (!existing) {
                await db.insert(cartParticipants).values({
                    id: generateId(),
                    cartId: cart.id,
                    userId: auth.userId,
                    role: "HOST",
                    status: "ACTIVE",
                });
            }

            return success({
                cartId: cart.id,
                inviteCode: inviteCodeFor(cart.id),
            });
        },
        { detail: { tags: ["Group Order"], summary: "Create a group cart (host)" } }
    )

    // View a group cart (participants only).
    .get(
        "/:cartId",
        async ({ auth, params }) => {
            const participant = await ensureParticipant(params.cartId, auth.userId);
            if (!participant) throw new ForbiddenError("You are not a participant");

            const cart = await db.query.carts.findFirst({
                where: eq(carts.id, params.cartId),
                with: {
                    items: {
                        with: { variant: { with: { product: true } } },
                    },
                },
            });
            if (!cart) throw new NotFoundError("Cart not found");
            return success({ cart, inviteCode: inviteCodeFor(cart.id) });
        },
        { detail: { tags: ["Group Order"], summary: "Get group cart details" } }
    )

    // Join a group cart via share code.
    .post(
        "/join",
        async ({ auth, body }) => {
            const code = body.inviteCode.trim().toUpperCase();
            const m = /^GP-([A-Za-z0-9_-]{8})$/.exec(code);
            if (!m) throw new NotFoundError("Invalid invite code");

            const [cart] = await db
                .select()
                .from(carts)
                .where(sql`${carts.id} ILIKE ${`%${m[1]}%`}`)
                .limit(1);
            if (!cart) throw new NotFoundError("Group cart not found");
            if (cart.type !== "GROUP") throw new ConflictError("This cart is not a group cart");

            const existing = await ensureParticipant(cart.id, auth.userId);
            if (existing) throw new ConflictError("You already joined this group cart");

            await db.insert(cartParticipants).values({
                id: generateId(),
                cartId: cart.id,
                userId: auth.userId,
                role: "MEMBER",
                status: "ACTIVE",
            });

            return success({ cartId: cart.id, inviteCode: code });
        },
        {
            body: t.Object({ inviteCode: t.String({ minLength: 11, maxLength: 11 }) }),
            detail: { tags: ["Group Order"], summary: "Join a group cart by code" },
        }
    )

    // Real participant list.
    .get(
        "/:cartId/participants",
        async ({ auth, params }) => {
            const participant = await ensureParticipant(params.cartId, auth.userId);
            if (!participant) throw new ForbiddenError("You are not a participant");

            const rows = await db
                .select({
                    id: cartParticipants.id,
                    userId: cartParticipants.userId,
                    role: cartParticipants.role,
                    status: cartParticipants.status,
                    joinedAt: cartParticipants.joinedAt,
                })
                .from(cartParticipants)
                .where(eq(cartParticipants.cartId, params.cartId));

            return success(rows);
        },
        { detail: { tags: ["Group Order"], summary: "List group participants" } }
    )

    // Leave the group cart.
    .post(
        "/:cartId/leave",
        async ({ auth, params }) => {
            const participant = await ensureParticipant(params.cartId, auth.userId);
            if (!participant) throw new ForbiddenError("You are not a participant");
            if (participant.role === "HOST") {
                throw new ConflictError("The host cannot leave. Delete the group cart instead.");
            }

            await db
                .update(cartParticipants)
                .set({ status: "LEFT" })
                .where(eq(cartParticipants.id, participant.id));

            // Remove their items from the shared cart.
            await db.delete(cartItems).where(
                and(eq(cartItems.cartId, params.cartId), eq(cartItems.addedBy, auth.userId))
            );

            return success({ left: true });
        },
        { detail: { tags: ["Group Order"], summary: "Leave a group cart" } }
    );
