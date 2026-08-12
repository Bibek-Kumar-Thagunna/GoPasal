import { describe, expect, it, beforeAll } from "bun:test";
import { db } from "@/db";
import { users, carts, cartItems, cartParticipants, productVariants, products, stores, inventory, categories } from "@/db/schema";
import { generateId } from "@/utils";
import { eq, and } from "drizzle-orm";

describe("Group Order", () => {
    let hostId: string;
    let memberId: string;
    let cartId: string;
    let variantId: string;

    beforeAll(async () => {
        hostId = "gtest_host_" + generateId();
        memberId = "gtest_member_" + generateId();
        const storeId = "gtest_store_" + generateId();
        const productId = "gtest_prod_" + generateId();
        variantId = "gtest_var_" + generateId();

        await db.insert(users).values([
            { id: hostId, email: `gtest_h_${generateId()}@t.com`, phone: "+9779" + Math.floor(900000000 + Math.random() * 999999999).toString(), isPhoneVerified: true },
            { id: memberId, email: `gtest_m_${generateId()}@t.com`, phone: "+9779" + Math.floor(900000000 + Math.random() * 999999999).toString(), isPhoneVerified: true },
        ] as never);

        const categoryId = "cat_gtest_" + generateId();
        await db.insert(categories).values({ id: categoryId, name: "GTest", slug: "gtest-" + generateId(), isActive: true } as never);
        await db.insert(stores).values({ id: storeId, ownerId: hostId, name: "GTest Store", slug: "gtest-store-" + generateId(), status: "ACTIVE" } as never);
        await db.insert(products).values({ id: productId, storeId, categoryId, name: "GP", slug: "gp-" + generateId(), basePrice: "100", isActive: true, isDeliverable: true } as never);
        await db.insert(productVariants).values({ id: variantId, productId, name: "S", sku: "s-" + generateId(), priceOffset: "0" } as never);
        await db.insert(inventory).values({ id: "gtest_inv_" + generateId(), variantId, quantity: 100 } as never);

        cartId = "gtest_cart_" + generateId();
        await db.insert(carts).values({ id: cartId, userId: hostId, storeId, type: "SINGLE", status: "OPEN" });
        await db.insert(cartItems).values({ id: "gtest_item_" + generateId(), cartId, variantId, quantity: 2, addedBy: hostId });
    });

    it("converts the host cart to GROUP and registers the host participant", async () => {
        await db.update(carts).set({ type: "GROUP" }).where(eq(carts.id, cartId));
        await db.insert(cartParticipants).values({
            id: generateId(),
            cartId,
            userId: hostId,
            role: "HOST",
            status: "ACTIVE",
        });

        const [cart] = await db.select().from(carts).where(eq(carts.id, cartId));
        expect(cart.type).toBe("GROUP");

        const host = await db
            .select()
            .from(cartParticipants)
            .where(and(eq(cartParticipants.cartId, cartId), eq(cartParticipants.userId, hostId)));
        expect(host).toHaveLength(1);
        expect(host[0].role).toBe("HOST");
    });

    it("lets a member join and appears in the participant list", async () => {
        await db.insert(cartParticipants).values({
            id: generateId(),
            cartId,
            userId: memberId,
            role: "MEMBER",
            status: "ACTIVE",
        });

        const members = await db
            .select({ userId: cartParticipants.userId, role: cartParticipants.role })
            .from(cartParticipants)
            .where(eq(cartParticipants.cartId, cartId));
        expect(members.map((m) => m.userId).sort()).toEqual([hostId, memberId].sort());
        const member = members.find((m) => m.userId === memberId);
        expect(member?.role).toBe("MEMBER");
    });

    it("leaving removes the member's items from the shared cart", async () => {
        await db
            .update(cartParticipants)
            .set({ status: "LEFT" })
            .where(and(eq(cartParticipants.cartId, cartId), eq(cartParticipants.userId, memberId)));

        await db
            .delete(cartItems)
            .where(and(eq(cartItems.cartId, cartId), eq(cartItems.addedBy, memberId)));

        const left = await db
            .select()
            .from(cartParticipants)
            .where(and(eq(cartParticipants.cartId, cartId), eq(cartParticipants.userId, memberId)));
        expect(left[0].status).toBe("LEFT");
    });
});
