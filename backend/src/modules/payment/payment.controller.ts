import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { paymentService } from "./payment.service";
import { db } from "@/db";
import { settlements } from "@/db/schema/payments";
import { desc } from "drizzle-orm";
import { success } from "@/utils/response";

export const paymentController = new Elysia({ prefix: "/payments" })
    .use(requireAuth())
    .post("/intent", async ({ body, auth }) => {
        const { orderId, method, amount } = body as any;
        return await paymentService.createPaymentIntent(orderId, method, amount, undefined, auth.userId);
    })
    .post("/confirm/:id", async ({ params, body }) => {
        const { gatewayRef } = body as any;
        return await paymentService.confirmPayment(params.id, gatewayRef);
    })
    .get("/settlements", async ({ query }) => {
        const limit = Math.min(Number(query.limit) || 50, 200);
        const rows = await db
            .select()
            .from(settlements)
            .orderBy(desc(settlements.createdAt))
            .limit(limit);
        return success(rows);
    });
