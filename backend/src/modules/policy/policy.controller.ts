import { Elysia } from "elysia";
import { requireAuth } from "@/middlewares/auth";
import { policyService } from "./policy.service";

export const policyController = new Elysia({ prefix: "/policies" })
    .get("/latest/:category", async ({ params }) => {
        return await policyService.getLatestPolicy(params.category);
    })
    .use(requireAuth())
    .post("/consent", async ({ body, auth, request }) => {
        const { policyId } = body as any;
        const ip = request.headers.get("x-forwarded-for") || "unknown"; // simplified
        const ua = request.headers.get("user-agent") || "unknown";
        return await policyService.recordConsent(auth.userId, policyId, ip, ua);
    });
