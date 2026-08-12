import { Elysia, t } from "elysia";
import { requireAuth } from "@/middlewares";
import { OrderService } from "./order.service";
import { success, created } from "@/utils/response";
import { NotFoundError } from "@/utils/errors";

const orderService = new OrderService();

export const orderController = new Elysia({ prefix: "/api/v1/orders" })
    .use(requireAuth())

    .post(
        "/checkout",
        async ({ auth, body, set }) => {
            const result = await orderService.placeOrder(auth.userId, {
                fulfillmentType: body.fulfillmentType,
                deliveryAddressId: body.deliveryAddressId,
                paymentMethod: body.paymentMethod,
                notes: body.notes,
                isGreenDelivery: body.isGreenDelivery,
                couponCode: body.couponCode,
            });
            set.status = 201;
            return created(result);
        },
        {
            body: t.Object({
                fulfillmentType: t.Optional(
                    t.Union([
                        t.Literal("MERCHANT_DELIVERY"),
                        t.Literal("PICKUP"),
                        t.Literal("PLATFORM_LOGISTICS"),
                    ])
                ),
                deliveryAddressId: t.Optional(t.String()),
                paymentMethod: t.Union([
                    t.Literal("COD"),
                    t.Literal("ESEWA"),
                    t.Literal("KHALTI"),
                ]),
                notes: t.Optional(t.String()),
                isGreenDelivery: t.Optional(t.Boolean()),
                couponCode: t.Optional(t.String()),
            }),
            detail: { tags: ["Order"], summary: "Place a new order (Checkout)" },
        }
    )
    .get(
        "/",
        async ({ auth }) => {
            const orders = await orderService.listOrders(auth.userId);
            return success(orders);
        },
        {
            detail: { tags: ["Order"], summary: "List my orders" },
        }
    )
    .get(
        "/:id",
        async ({ auth, params }) => {
            const order = await orderService.getOrder(auth.userId, params.id);
            return success(order);
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Order"], summary: "Get order details" },
        }
    )
    .get(
        "/:id/rider-location",
        async ({ auth, params }) => {
            // Only the order owner may see the rider's live location.
            const order = await orderService.getOrder(auth.userId, params.id);
            if (!order) throw new NotFoundError("Order");
            const { deliveryService } = await import("@/modules/delivery/delivery.service");
            return success(await deliveryService.getOrderRiderLocation(params.id));
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { tags: ["Order"], summary: "Get live rider location (customer)" },
        }
    )
    .put(
        "/:id/cancel",
        async ({ auth, params, body }) => {
            const order = await orderService.cancelOrder(
                auth.userId,
                params.id,
                body.reason
            );
            return success(order);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                reason: t.Optional(t.String()),
            }),
            detail: { tags: ["Order"], summary: "Cancel order" },
        }
    )
    .patch(
        "/:id/status",
        async ({ auth, params, body }) => {
            const order = await orderService.updateStatus(
                auth.userId,
                params.id,
                body.status as any,
                auth.roles,
                body.notes,
                { codCollected: body.codCollected }
            );
            return success(order);
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                status: t.String(),
                notes: t.Optional(t.String()),
                codCollected: t.Optional(t.Boolean()),
            }),
            detail: { tags: ["Order"], summary: "Update order status (Seller/Rider)" },
        }
    );
