import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { env } from "@/config";
import { AuthError } from "@/utils/errors";
import type { AuthContext, JWTPayload } from "@/types";

export const authPlugin = new Elysia({ name: "auth-plugin" })
    .use(bearer())
    .use(
        jwt({
            name: "accessJwt",
            secret: env.JWT_ACCESS_SECRET,
        })
    )
    .use(
        jwt({
            name: "refreshJwt",
            secret: env.JWT_REFRESH_SECRET,
        })
    );

/** Scoped auth guard — use `requireAuth()` per controller (no static plugin name). */
export function requireAuth() {
    return new Elysia()
        .use(authPlugin)
        .derive({ as: "scoped" }, async (context: any): Promise<{ auth: AuthContext }> => {
            const bearer = context.bearer as string | undefined || context.query?.token as string | undefined;
            const accessJwt = context.accessJwt as any;
            if (!bearer) {
                throw new AuthError("Missing authorization token");
            }

            const payload = await accessJwt.verify(bearer);
            if (!payload) {
                throw new AuthError("Invalid or expired token");
            }

            const jwtPayload = payload as unknown as JWTPayload;

            if (jwtPayload.type !== "access") {
                throw new AuthError("Invalid token type");
            }

            const auth: AuthContext = {
                userId: jwtPayload.sub,
                roles: jwtPayload.roles,
                tenantId: jwtPayload.tenantId ?? null,
                sessionId: jwtPayload.sessionId,
            };

            return { auth };
        });
}
