import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares";
import { CartService } from "./cart.service";
import { success, created } from "@/utils/response";

const cartService = new CartService();

export const cartController = new Elysia({ prefix: "/api/v1/cart" })
    .use(requireAuth())

    .get(
        "/",
        async ({ auth }) => {
            const cart = await cartService.getCart(auth.userId);
            return success(cart || { items: [] });
        },
        {
            detail: { tags: ["Cart"], summary: "Get current cart" },
        }
    )
    .post(
        "/items",
        async ({ auth, body, set }) => {
            const cart = await cartService.addItem(
                auth.userId,
                body.variantId,
                body.quantity
            );
            set.status = 201;
            return created(cart);
        },
        {
            body: t.Object({
                variantId: t.String(),
                quantity: t.Integer({ minimum: 1 }),
            }),
            detail: { tags: ["Cart"], summary: "Add item to cart" },
        }
    )
    .put(
        "/items/:id",
        async ({ auth, params, body }) => {
            const cart = await cartService.updateItem(
                auth.userId,
                params.id,
                body.quantity
            );
            return success(cart);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                quantity: t.Integer({ minimum: 0 }),
            }),
            detail: { tags: ["Cart"], summary: "Update item quantity" },
        }
    )
    .delete(
        "/items/:id",
        async ({ auth, params }) => {
            const cart = await cartService.removeItem(auth.userId, params.id);
            return success(cart);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Cart"], summary: "Remove item from cart" },
        }
    )
    .delete(
        "/",
        async ({ auth }) => {
            const result = await cartService.clearCart(auth.userId);
            return success(result);
        },
        {
            detail: { tags: ["Cart"], summary: "Clear entire cart" },
        }
    );
