import { Elysia, t } from "elysia";
import { smartReorderService } from "./smart-reorder.service";

export const smartReorderController = new Elysia({ prefix: "/orders/smart" })
    .get("/suggestions", async ({ query }) => {
        const userId = query.userId as string;
        if (!userId) throw new Error("userId required");
        return await smartReorderService.getReorderSuggestions(userId);
    })
    .post("/reorder/:variantId", async ({ params, body }) => {
        const userId = (body as any).userId;
        return await smartReorderService.reorderItem(userId, params.variantId);
    }, {
        body: t.Object({
            userId: t.String()
        })
    });
