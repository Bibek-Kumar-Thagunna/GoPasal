import { Elysia, t } from "elysia";
import { aiAgentService } from "./ai-agent.service";
import { requireAuth } from "@/middlewares/auth";

export const supportController = new Elysia({ prefix: "/support" })
    .use(requireAuth())
    .post("/chat", async ({ body, auth }) => {
        // userId always comes from the authenticated session — never from the body.
        return await aiAgentService.handleQuery(auth.userId, body.message, body.conversationId);
    }, {
        body: t.Object({
            message: t.String(),
            conversationId: t.Optional(t.String())
        })
    });
