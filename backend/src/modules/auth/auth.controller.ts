import { Elysia, t } from "elysia";
import { authPlugin, requireAuth } from "@/middlewares";
import { AuthService } from "./auth.service";
import { success, created } from "@/utils";
import { rateLimit } from "@/middlewares/rate-limit";

export const authController = new Elysia({ prefix: "/api/v1/auth" })
    .use(authPlugin)
    .decorate("authService", (accessJwt: any, refreshJwt: any) => new AuthService(accessJwt, refreshJwt))
    .use(rateLimit({ max: 3, windowMs: 60_000, prefix: "otp-send" }))
    .post(
        "/otp/send",
        async ({ body, accessJwt, refreshJwt }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const result = await service.sendOTP(body.phone);
            return success(result);
        },
        {
            body: t.Object({
                phone: t.String({ minLength: 7, maxLength: 20 }),
            }),
            detail: {
                tags: ["Auth"],
                summary: "Send OTP to phone number",
            },
        }
    )
    .use(rateLimit({ max: 10, windowMs: 60_000, prefix: "otp-verify" }))
    .post(
        "/otp/verify",
        async ({ body, accessJwt, refreshJwt, request, set }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
            const userAgent = request.headers.get("user-agent") || "unknown";

            const result = await service.verifyOTP(
                body.phone,
                body.otp,
                body.deviceId,
                ipAddress,
                userAgent
            );

            set.status = 201;
            return created({
                user: {
                    id: result.user.id,
                    phone: result.user.phone,
                    name: result.user.name,
                },
                tokens: result.tokens,
            });
        },
        {
            body: t.Object({
                phone: t.String({ minLength: 7, maxLength: 20 }),
                otp: t.String({ minLength: 6, maxLength: 6 }),
                deviceId: t.Optional(t.String()),
            }),
            detail: {
                tags: ["Auth"],
                summary: "Verify OTP and login",
            },
        }
    )
    .post(
        "/guest",
        async ({ body, accessJwt, refreshJwt, request, set }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
            const userAgent = request.headers.get("user-agent") || "unknown";

            const result = await service.guestLogin(
                body.deviceId,
                ipAddress,
                userAgent
            );

            set.status = 201;
            return created({
                user: {
                    id: result.user.id,
                    phone: result.user.phone,
                    name: result.user.name,
                },
                tokens: result.tokens,
            });
        },
        {
            body: t.Object({
                deviceId: t.String(),
            }),
            detail: {
                tags: ["Auth"],
                summary: "Login as a guest user",
            },
        }
    )
    .post(
        "/refresh",
        async ({ body, accessJwt, refreshJwt, request }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
            const userAgent = request.headers.get("user-agent") || "unknown";

            const tokens = await service.refreshToken(
                body.refreshToken,
                ipAddress,
                userAgent
            );

            return success(tokens);
        },
        {
            body: t.Object({
                refreshToken: t.String(),
            }),
            detail: {
                tags: ["Auth"],
                summary: "Refresh access token",
            },
        }
    )
    .use(requireAuth())
    .post(
        "/logout",
        async ({ auth, accessJwt, refreshJwt }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            await service.logout(auth.sessionId, auth.userId);
            return success({ message: "Logged out successfully" });
        },
        {
            detail: {
                tags: ["Auth"],
                summary: "Logout current session",
            },
        }
    )
    .post(
        "/logout-all",
        async ({ auth, accessJwt, refreshJwt }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            await service.revokeAllSessions(auth.userId);
            return success({ message: "All sessions revoked" });
        },
        {
            detail: {
                tags: ["Auth"],
                summary: "Revoke all sessions",
            },
        }
    )
    .get(
        "/me",
        async ({ auth, accessJwt, refreshJwt }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const profile = await service.getProfile(auth.userId);
            return success(profile);
        },
        {
            detail: {
                tags: ["Auth"],
                summary: "Get current user profile",
            },
        }
    );
