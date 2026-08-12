import { Elysia, t } from "elysia";
import { authPlugin } from "@/middlewares/auth";
import { AuthService } from "@/modules/auth/auth.service";
import { created, success } from "@/utils/response";
import { rateLimit } from "@/middlewares/rate-limit";

export const adminAuthController = new Elysia({ prefix: "/api/v1/admin/auth" })
    .use(authPlugin)
    .use(rateLimit({ max: 5, windowMs: 60_000, prefix: "admin-otp-send" }))
    .post(
        "/otp/send",
        async ({ body, accessJwt, refreshJwt }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const result = await service.sendOTPForAdmin(body.phone);
            return success(result);
        },
        {
            body: t.Object({
                phone: t.String({ minLength: 7, maxLength: 20 }),
            }),
            detail: {
                tags: ["Admin - Auth"],
                summary: "Send OTP only when the phone belongs to a platform admin",
            },
        }
    )
    .use(rateLimit({ max: 10, windowMs: 60_000, prefix: "admin-login" }))
    .post(
        "/login",
        async ({ body, accessJwt, refreshJwt, request, set }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const ip = request.headers.get("x-forwarded-for") || "unknown";
            const ua = request.headers.get("user-agent") || "unknown";
            const result = await service.loginWithEmailPasswordForAdmin(
                body.email,
                body.password,
                body.deviceId,
                ip,
                ua
            );
            set.status = 201;
            return created({
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    phone: result.user.phone,
                    name: result.user.name,
                },
                tokens: result.tokens,
            });
        },
        {
            body: t.Object({
                email: t.String({ format: "email" }),
                password: t.String({ minLength: 1 }),
                deviceId: t.Optional(t.String()),
            }),
            detail: {
                tags: ["Admin - Auth"],
                summary: "Admin email + password sign-in (SUPER_ADMIN / PLATFORM_OPERATOR only)",
            },
        }
    )
    .use(rateLimit({ max: 8, windowMs: 60_000, prefix: "admin-otp-verify" }))
    .post(
        "/otp/verify",
        async ({ body, accessJwt, refreshJwt, request, set }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const ip = request.headers.get("x-forwarded-for") || "unknown";
            const ua = request.headers.get("user-agent") || "unknown";
            const result = await service.verifyOTPForAdmin(
                body.phone,
                body.otp,
                body.deviceId,
                ip,
                ua
            );
            set.status = 201;
            return created({
                user: {
                    id: result.user.id,
                    email: result.user.email,
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
                tags: ["Admin - Auth"],
                summary: "Verify phone OTP for admin accounts only",
            },
        }
    )
    .use(rateLimit({ max: 10, windowMs: 60_000, prefix: "admin-google" }))
    .post(
        "/google",
        async ({ body, accessJwt, refreshJwt, request, set }) => {
            const service = new AuthService(accessJwt, refreshJwt);
            const ip = request.headers.get("x-forwarded-for") || "unknown";
            const ua = request.headers.get("user-agent") || "unknown";
            const result = await service.loginWithGoogleForAdmin(
                body.idToken,
                body.deviceId,
                ip,
                ua
            );
            set.status = 201;
            return created({
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    phone: result.user.phone,
                    name: result.user.name,
                },
                tokens: result.tokens,
            });
        },
        {
            body: t.Object({
                idToken: t.String({ minLength: 20 }),
                deviceId: t.Optional(t.String()),
            }),
            detail: {
                tags: ["Admin - Auth"],
                summary: "Admin sign-in with Google ID token",
            },
        }
    );
