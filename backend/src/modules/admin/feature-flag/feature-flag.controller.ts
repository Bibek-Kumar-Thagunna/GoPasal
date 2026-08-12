import { Elysia, t } from "elysia";
import { featureFlagService } from "./feature-flag.service";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { generateId } from "@/utils";

export const featureFlagController = new Elysia({ prefix: "/feature-flags" })
    .post("/evaluate", async ({ body }) => {
        // Client SDK Endpoint
        return await featureFlagService.evaluateAll(body as any);
    }, {
        body: t.Object({
            userId: t.Optional(t.String()),
            email: t.Optional(t.String()),
            // Allow other props
        })
    })

    // Admin Endpoints (Should be protected via RBAC normally)
    .get("/", async () => {
        return await db.select().from(featureFlags);
    })

    .post("/", async ({ body }) => {
        const id = generateId();
        await db.insert(featureFlags).values({
            id,
            key: body.key,
            description: body.description,
            isEnabled: body.isEnabled,
            clientSide: body.clientSide,
            rules: body.rules || []
        });
        return { message: "Flag created", id };
    }, {
        body: t.Object({
            key: t.String(),
            description: t.Optional(t.String()),
            isEnabled: t.Boolean(),
            clientSide: t.Boolean(),
            rules: t.Optional(t.Any())
        })
    });
