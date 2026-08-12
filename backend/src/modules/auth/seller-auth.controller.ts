import { Elysia, t } from "elysia";
import { authPlugin, requireAuth } from "@/middlewares";
import {
    assertPendingRegistrationOtp,
    phoneFromRegistrationSubject,
    SellerAuthService,
} from "./seller-auth.service";
import { success, created } from "@/utils";
import { AuthError } from "@/utils/errors";
import { rateLimit } from "@/middlewares/rate-limit";
import { saveKycUpload } from "@/modules/seller/media/kyc-media";
import { ValidationError } from "@/utils/errors";

export const sellerAuthController = new Elysia({ prefix: "/api/v1/seller/auth" })
    .use(authPlugin)
    // Step 1: Validate uniqueness + send OTP (NO user created)
    .use(rateLimit({ max: 60, windowMs: 60_000, prefix: "seller-register" }))
    .post(
        "/register",
        async ({ body, accessJwt, refreshJwt, set }) => {
            const service = new SellerAuthService(accessJwt, refreshJwt);
            const result = await service.validateAndSendOtp(body);
            set.status = 200;
            return success({
                message: result.message,
                expiresIn: result.expiresIn,
            });
        },
        {
            body: t.Object({
                name: t.String({ minLength: 2, maxLength: 255 }),
                email: t.String({ format: "email" }),
                phone: t.String({ minLength: 7, maxLength: 20 }),
                password: t.String({ minLength: 8, maxLength: 128 }),
            }),
            detail: {
                tags: ["Seller - Auth"],
                summary: "Validate seller details and send OTP (no user created)",
            },
        }
    )
    .use(rateLimit({ max: 60, windowMs: 60_000, prefix: "seller-register-confirm-otp" }))
    .post(
        "/register/confirm-otp",
        async ({ body, accessJwt, refreshJwt }) => {
            const service = new SellerAuthService(accessJwt, refreshJwt);
            const result = await service.confirmRegistrationOtp(body.phone, body.otp);
            return success(result);
        },
        {
            body: t.Object({
                phone: t.String({ minLength: 7, maxLength: 20 }),
                otp: t.String({ minLength: 6, maxLength: 6 }),
            }),
            detail: {
                tags: ["Seller - Auth"],
                summary: "Verify registration OTP and issue upload token",
            },
        }
    )
    .use(rateLimit({ max: 100, windowMs: 60_000, prefix: "seller-register-kyc" }))
    .post(
        "/register/kyc-upload",
        async ({ request, accessJwt }) => {
            let form: FormData;
            try {
                form = await request.formData();
            } catch {
                throw new ValidationError("Failed to decode file payload. Please choose a valid PDF, JPG, or PNG document.");
            }
            const phoneEntry = form.get("phone");
            const tokenEntry = form.get("registrationToken");
            const fileEntry = form.get("file");
            if (!fileEntry || typeof fileEntry === "string" || !(fileEntry instanceof File)) {
                throw new ValidationError("Missing file field");
            }

            let phone: string | null = null;
            if (typeof tokenEntry === "string" && tokenEntry.trim()) {
                const payload = await accessJwt.verify(tokenEntry.trim());
                if (!payload || (payload as { type?: string }).type !== "registration") {
                    throw new AuthError("Invalid registration session");
                }
                phone = phoneFromRegistrationSubject(String((payload as { sub?: string }).sub ?? ""));
            } else if (typeof phoneEntry === "string" && phoneEntry.trim()) {
                phone = phoneEntry.trim();
                await assertPendingRegistrationOtp(phone);
            } else {
                throw new ValidationError("Missing registration session");
            }

            if (!phone) {
                throw new ValidationError("Invalid registration session");
            }

            const origin = new URL(request.url).origin;
            const url = await saveKycUpload(fileEntry, origin);
            return success({ url });
        },
        {
            detail: {
                tags: ["Seller - Auth"],
                summary: "Upload KYC file during registration (pending OTP required)",
            },
        }
    )
    // Final step: Verify OTP + create user + return tokens
    .use(rateLimit({ max: 60, windowMs: 60_000, prefix: "seller-complete" }))
    .post(
        "/complete-registration",
        async ({ body, accessJwt, refreshJwt, request, set }) => {
            const service = new SellerAuthService(accessJwt, refreshJwt);
            const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
            const userAgent = request.headers.get("user-agent") || "unknown";

            const result = await service.completeRegistration(body, ipAddress, userAgent);

            set.status = 201;
            return created({
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    phone: result.user.phone,
                },
                tokens: result.tokens,
            });
        },
        {
            body: t.Object({
                name: t.String({ minLength: 2, maxLength: 255 }),
                email: t.String({ format: "email" }),
                phone: t.String({ minLength: 7, maxLength: 20 }),
                password: t.String({ minLength: 8, maxLength: 128 }),
                otp: t.String({ minLength: 6, maxLength: 6 }),
                category: t.Optional(t.String()),
                businessName: t.Optional(t.String()),
                businessAddress: t.Optional(t.String()),
                panVat: t.Optional(t.String()),
                businessRegDoc: t.Optional(t.String()),
                storeLicense: t.Optional(t.String()),
                storePhotos: t.Optional(t.Array(t.String())),
            }),
            detail: {
                tags: ["Seller - Auth"],
                summary: "Complete registration: verify OTP, create user, return tokens",
            },
        }
    )
    // Login
    .post(
        "/login",
        async ({ body, accessJwt, refreshJwt, request }) => {
            const service = new SellerAuthService(accessJwt, refreshJwt);
            const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
            const userAgent = request.headers.get("user-agent") || "unknown";

            const result = await service.login(
                body.email,
                body.password,
                ipAddress,
                userAgent
            );

            return success({
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    phone: result.user.phone,
                },
                tokens: result.tokens,
            });
        },
        {
            body: t.Object({
                email: t.String({ format: "email" }),
                password: t.String({ minLength: 1 }),
            }),
            detail: {
                tags: ["Seller - Auth"],
                summary: "Seller login with email and password",
            },
        }
    )
    // Google OAuth
    .post(
        "/google",
        async ({ body, accessJwt, refreshJwt, set }) => {
            const service = new SellerAuthService(accessJwt, refreshJwt);
            const result = await service.googleAuth(body);

            if (result.isNew) set.status = 201;

            const respFn = result.isNew ? created : success;
            return respFn({
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                },
                tokens: result.tokens,
                isNew: result.isNew,
            });
        },
        {
            body: t.Object({
                googleId: t.String(),
                email: t.String({ format: "email" }),
                name: t.String(),
                avatarUrl: t.Optional(t.String()),
            }),
            detail: {
                tags: ["Seller - Auth"],
                summary: "Google OAuth seller login / registration",
            },
        }
    )
    .use(requireAuth())
    .post(
        "/switch-store",
        async ({ body, auth, accessJwt, refreshJwt, request }) => {
            const service = new SellerAuthService(accessJwt, refreshJwt);
            const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
            const userAgent = request.headers.get("user-agent") || "unknown";
            if (!auth.userId) throw new AuthError("Unauthorized");
            const tokens = await service.switchStore(
                auth.userId,
                body.storeId,
                ipAddress,
                userAgent
            );
            return success({ tokens });
        },
        {
            body: t.Object({
                storeId: t.String({ minLength: 1 }),
            }),
            detail: {
                tags: ["Seller - Auth"],
                summary: "Switch active store (branch) for seller JWT tenant",
            },
        }
    );
