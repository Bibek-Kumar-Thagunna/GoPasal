import { Elysia, t } from "elysia";
import { reorderService } from "./reorder.service";

export const reorderController = new Elysia({ prefix: "/orders" })
    .get("/buy-again", async ({ query }) => {
        const userId = query.userId as string; // in real app, from Auth context
        if (!userId) throw new Error("userId required");
        return await reorderService.getBuyAgain(userId);
    })
    .post("/:id/clone", async ({ params, body }) => {
        const { userId } = body as { userId: string };
        return await reorderService.cloneOrder(userId, params.id);
    }, {
        body: t.Object({
            userId: t.String()
        })
    });
