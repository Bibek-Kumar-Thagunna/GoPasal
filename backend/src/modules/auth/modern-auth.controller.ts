import { Elysia, t } from "elysia";
import { AuthService } from "./auth.service";
import { IdentityService } from "./identity.service";
import { BiometricService } from "./biometric.service";
import { SilentAuthService } from "./silent-auth.service";

import { authPlugin } from "@/middlewares";

export const modernAuthController = new Elysia({ prefix: "/api/v1/auth" })
    .use(authPlugin)
    .decorate("authService", (accessJwt: any, refreshJwt: any) => new AuthService(accessJwt, refreshJwt))
    .post("/social/login", async ({ body, accessJwt, refreshJwt, request }) => {
        const authService = new AuthService(accessJwt, refreshJwt);
        const identityService = new IdentityService(authService);
        const ip = request.headers.get("x-forwarded-for") || "unknown";

        return await identityService.verifyAndLoginSocial(
            body.provider as any,
            body.token,
            ip
        );
    }, {
        body: t.Object({
            provider: t.String(), // GOOGLE, APPLE...
            token: t.String()
        })
    })
    .post("/biometric/challenge", async ({ body: _body }) => {
        const biometricService = new BiometricService();
        // Login challenge (no user ID needed usually for assertion, but simplified here)
        return await biometricService.getLoginOptions();
    })
    .post("/biometric/login", async ({ body }) => {
        const biometricService = new BiometricService();
        return await biometricService.verifyLogin(body);
    }, {
        body: t.Object({
            id: t.String(),
            clientDataJSON: t.String()
        })
    })
    .post("/silent/verify", async ({ body, accessJwt, refreshJwt, request }) => {
        const authService = new AuthService(accessJwt, refreshJwt);
        const silentService = new SilentAuthService(authService);
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        return await silentService.verifySilent(body.phone, body.mobileToken, ip);
    }, {
        body: t.Object({
            phone: t.String(),
            mobileToken: t.String()
        })
    });
