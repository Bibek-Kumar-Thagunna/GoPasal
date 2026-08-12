import { db } from "@/db";
import { users, sessions, otps, userRoles, roles } from "@/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { env, AUTH } from "@/config";
import {
    generateId,
    generateOTP,
    hashPassword,
    verifyPassword,
    
    AuthError,
} from "@/utils";
import { createAuditLog } from "@/shared";
import type { TokenPair, JWTPayload, UserRole } from "@/types";
import { accessJwt, refreshJwt } from "@/utils/jwt";

export class AuthService {
    constructor(
        private accessJwt: { sign: (payload: any) => Promise<string>; verify: (token: string) => Promise<any> },
        private refreshJwt: { sign: (payload: any) => Promise<string>; verify: (token: string) => Promise<any> }
    ) { }

    async sendOTP(phone: string): Promise<{ message: string; expiresIn: number }> {
        const otp = generateOTP();
        const otpHash = await hashPassword(otp);
        const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);

        await db.insert(otps).values({
            id: generateId(),
            phone,
            otpHash,
            expiresAt,
        });

        const { deliverOtpSms } = await import("@/integrations/sms.service");
        await deliverOtpSms(phone, otp, env.OTP_EXPIRY_SECONDS);

        return {
            message: "OTP sent successfully",
            expiresIn: env.OTP_EXPIRY_SECONDS,
        };
    }

    async sendOTPForAdmin(phone: string): Promise<{
        message: string;
        expiresIn: number;
    }> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.phone, phone))
            .limit(1);

        const neutral = {
            message:
                "If this number is registered for admin access, you will receive a code.",
            expiresIn: env.OTP_EXPIRY_SECONDS,
        };

        if (!user) {
            return neutral;
        }

        const userRoleRecords = await db
            .select({ roleName: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, user.id));

        const roleNames = userRoleRecords.map((r) => r.roleName) as UserRole[];
        const isAdmin = roleNames.some(
            (r) => r === "SUPER_ADMIN" || r === "PLATFORM_OPERATOR"
        );
        if (!isAdmin) {
            return neutral;
        }

        return this.sendOTP(phone);
    }

    async verifyOTP(
        phone: string,
        otpInput: string,
        deviceId?: string,
        ipAddress?: string,
        userAgent?: string,
        options?: { restrictToRoles?: UserRole[] }
    ): Promise<{ user: typeof users.$inferSelect; tokens: TokenPair }> {
        // Find the latest valid OTP for this phone
        const [otpRecord] = await db
            .select()
            .from(otps)
            .where(
                and(
                    eq(otps.phone, phone),
                    gt(otps.expiresAt, new Date())
                )
            )
            .orderBy(desc(otps.createdAt))
            .limit(1);

        if (!otpRecord) {
            throw new AuthError("OTP expired or not found");
        }

        if (otpRecord.usedAt) {
            throw new AuthError("OTP already used");
        }

        const attempts = parseInt(otpRecord.attempts, 10);
        if (attempts >= AUTH.MAX_OTP_ATTEMPTS) {
            throw new AuthError("Maximum OTP attempts exceeded");
        }

        const isValid = await verifyPassword(otpInput, otpRecord.otpHash);


        // Increment attempt count
        await db
            .update(otps)
            .set({ attempts: String(attempts + 1) })
            .where(eq(otps.id, otpRecord.id));

        if (!isValid) {
            throw new AuthError("Invalid OTP");
        }

        // Mark OTP as used
        await db
            .update(otps)
            .set({ usedAt: new Date() })
            .where(eq(otps.id, otpRecord.id));

        // Find or create user
        let [user] = await db.select().from(users).where(eq(users.phone, phone));

        if (!user && options?.restrictToRoles?.length) {
            throw new AuthError("No admin account registered for this phone number");
        }

        if (!user) {
            const userId = generateId();
            [user] = await db
                .insert(users)
                .values({
                    id: userId,
                    phone,
                    isPhoneVerified: true,
                })
                .returning();

            // Assign CUSTOMER role by default
            const [customerRole] = await db
                .select()
                .from(roles)
                .where(eq(roles.name, "CUSTOMER"));

            if (customerRole) {
                await db.insert(userRoles).values({
                    userId,
                    roleId: customerRole.id,
                });
            }

            await createAuditLog({
                actorId: userId,
                action: "CREATE",
                resource: "users",
                resourceId: userId,
                afterState: { phone, isPhoneVerified: true },
                ipAddress,
            });
        } else {
            await db
                .update(users)
                .set({ lastLoginAt: new Date(), isPhoneVerified: true })
                .where(eq(users.id, user.id));
        }

        // Get user roles
        const userRoleRecords = await db
            .select({ 
                roleName: roles.name,
                roleId: roles.id,
                tenantId: userRoles.tenantId
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, user.id));

        const roleNames = userRoleRecords.map((r) => r.roleName) as UserRole[];

        if (options?.restrictToRoles?.length) {
            const allowed = roleNames.some((r) =>
                options.restrictToRoles!.includes(r as UserRole)
            );
            if (!allowed) {
                throw new AuthError("This account is not authorized for admin access");
            }
        }

        // Determine tenant context
        const tenantRole = userRoleRecords.find(
            (r) => r.roleName === "SELLER_OWNER" || r.roleName === "SELLER_STAFF"
        );
        let tenantId: string | null = null;
        if (tenantRole) {
            tenantId = tenantRole.tenantId || null;
        }

        // Create session and tokens
        const tokens = await this.createSession(
            user.id,
            roleNames,
            tenantId,
            deviceId,
            ipAddress,
            userAgent
        );

        await createAuditLog({
            actorId: user.id,
            action: "LOGIN",
            resource: "sessions",
            metadata: { deviceId, method: "OTP" },
            ipAddress,
        });

        return { user, tokens };
    }

    async guestLogin(
        deviceId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ user: typeof users.$inferSelect; tokens: TokenPair }> {
        // Hash the deviceId to ensure it fits in the 20-character phone field (e.g. guest_<14-char-hash>)
        const hashedDevice = require("crypto")
            .createHash("md5")
            .update(deviceId)
            .digest("hex")
            .slice(0, 14);
        const guestPhone = `guest_${hashedDevice}`;
        let [user] = await db.select().from(users).where(eq(users.phone, guestPhone));

        if (!user) {
            const userId = generateId();
            [user] = await db
                .insert(users)
                .values({
                    id: userId,
                    phone: guestPhone,
                    name: "Guest User",
                    isPhoneVerified: false,
                })
                .returning();

            // Assign CUSTOMER role
            const [customerRole] = await db
                .select()
                .from(roles)
                .where(eq(roles.name, "CUSTOMER"));

            if (customerRole) {
                await db.insert(userRoles).values({
                    userId,
                    roleId: customerRole.id,
                });
            }

            await createAuditLog({
                actorId: userId,
                action: "CREATE",
                resource: "users",
                resourceId: userId,
                afterState: { phone: guestPhone, isGuest: true },
                ipAddress,
            });
        } else {
            await db
                .update(users)
                .set({ lastLoginAt: new Date() })
                .where(eq(users.id, user.id));
        }

        const tokens = await this.createSession(
            user.id,
            ["CUSTOMER"], // Default for guest
            null,
            deviceId,
            ipAddress,
            userAgent
        );

        await createAuditLog({
            actorId: user.id,
            action: "LOGIN",
            resource: "sessions",
            metadata: { deviceId, method: "GUEST" },
            ipAddress,
        });

        return { user, tokens };
    }

    async verifyOTPForAdmin(
        phone: string,
        otpInput: string,
        deviceId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ user: typeof users.$inferSelect; tokens: TokenPair }> {
        return this.verifyOTP(phone, otpInput, deviceId, ipAddress, userAgent, {
            restrictToRoles: ["SUPER_ADMIN", "PLATFORM_OPERATOR"],
        });
    }

    async loginWithEmailPasswordForAdmin(
        email: string,
        password: string,
        deviceId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ user: typeof users.$inferSelect; tokens: TokenPair }> {
        const normalized = email.trim().toLowerCase();
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalized))
            .limit(1);

        if (!user?.passwordHash) {
            throw new AuthError("Invalid email or password");
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            throw new AuthError("Invalid email or password");
        }

        await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

        const userRoleRecords = await db
            .select({
                roleName: roles.name,
                tenantId: userRoles.tenantId,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, user.id));

        const roleNames = userRoleRecords.map((r) => r.roleName) as UserRole[];
        const isAdmin = roleNames.some(
            (r) => r === "SUPER_ADMIN" || r === "PLATFORM_OPERATOR"
        );
        if (!isAdmin) {
            throw new AuthError("This account is not authorized for admin access");
        }

        const tenantRole = userRoleRecords.find(
            (r) => r.roleName === "SELLER_OWNER" || r.roleName === "SELLER_STAFF"
        );
        const tenantId = tenantRole?.tenantId || null;

        const tokens = await this.createSession(
            user.id,
            roleNames,
            tenantId,
            deviceId,
            ipAddress,
            userAgent
        );

        await createAuditLog({
            actorId: user.id,
            action: "LOGIN",
            resource: "sessions",
            metadata: { method: "admin_email_password" },
            ipAddress,
        });

        return { user, tokens };
    }

    async loginWithGoogleForAdmin(
        idToken: string,
        deviceId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ user: typeof users.$inferSelect; tokens: TokenPair }> {
        const { verifyGoogleIdToken } = await import("@/integrations/google-oauth");
        const profile = await verifyGoogleIdToken(idToken);
        if (!profile) {
            throw new AuthError("Google sign-in failed. Check GOOGLE_CLIENT_ID on the server.");
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, profile.email))
            .limit(1);

        if (!user) {
            throw new AuthError("No admin account is linked to this Google email");
        }

        const userRoleRecords = await db
            .select({
                roleName: roles.name,
                tenantId: userRoles.tenantId,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, user.id));

        const roleNames = userRoleRecords.map((r) => r.roleName) as UserRole[];
        const isAdmin = roleNames.some(
            (r) => r === "SUPER_ADMIN" || r === "PLATFORM_OPERATOR"
        );
        if (!isAdmin) {
            throw new AuthError("This account is not authorized for admin access");
        }

        if (!user.googleId) {
            await db
                .update(users)
                .set({ googleId: profile.sub, avatarUrl: profile.picture ?? user.avatarUrl })
                .where(eq(users.id, user.id));
        }

        await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

        const tenantRole = userRoleRecords.find(
            (r) => r.roleName === "SELLER_OWNER" || r.roleName === "SELLER_STAFF"
        );
        const tenantId = tenantRole?.tenantId || null;

        const tokens = await this.createSession(
            user.id,
            roleNames,
            tenantId,
            deviceId,
            ipAddress,
            userAgent
        );

        await createAuditLog({
            actorId: user.id,
            action: "LOGIN",
            resource: "sessions",
            metadata: { method: "admin_google" },
            ipAddress,
        });

        return { user, tokens };
    }

    async createSession(
        userId: string,
        userRoles: UserRole[],
        tenantId: string | null,
        deviceId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<TokenPair> {
        const sessionId = generateId();

        const accessPayload: JWTPayload = {
            sub: userId,
            roles: userRoles,
            tenantId,
            sessionId,
            type: "access",
        };

        const refreshPayload: JWTPayload = {
            sub: userId,
            roles: userRoles,
            tenantId,
            sessionId,
            type: "refresh",
        };

        const accessToken = await this.accessJwt.sign(accessPayload as any);
        const refreshToken = await this.refreshJwt.sign(refreshPayload as any);

        const refreshHash = await hashPassword(refreshToken);

        await db.insert(sessions).values({
            id: sessionId,
            userId,
            refreshToken: refreshHash,
            deviceId,
            userAgent,
            ipAddress,
            expiresAt: new Date(Date.now() + AUTH.REFRESH_TOKEN_EXPIRY_MS),
        });

        return { accessToken, refreshToken };
    }

    async refreshToken(
        refreshTokenInput: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<TokenPair> {
        const payload = await this.refreshJwt.verify(refreshTokenInput);
        if (!payload) {
            throw new AuthError("Invalid refresh token");
        }

        const jwtPayload = payload as unknown as JWTPayload;
        if (jwtPayload.type !== "refresh") {
            throw new AuthError("Invalid token type");
        }

        const [session] = await db
            .select()
            .from(sessions)
            .where(
                and(
                    eq(sessions.id, jwtPayload.sessionId),
                    eq(sessions.status, "ACTIVE")
                )
            );

        if (!session) {
            throw new AuthError("Session not found or expired");
        }

        if (session.expiresAt < new Date()) {
            await db
                .update(sessions)
                .set({ status: "EXPIRED" })
                .where(eq(sessions.id, session.id));
            throw new AuthError("Session expired");
        }

        const isValid = await verifyPassword(refreshTokenInput, session.refreshToken);
        if (!isValid) {
            // Potential token reuse attack — revoke all sessions
            await this.revokeAllSessions(jwtPayload.sub);
            throw new AuthError("Token reuse detected — all sessions revoked");
        }

        // Revoke old session
        await db
            .update(sessions)
            .set({ status: "REVOKED", updatedAt: new Date() })
            .where(eq(sessions.id, session.id));

        // Get current roles and tenantId
        const userRoleRecords = await db
            .select({
                roleName: roles.name,
                tenantId: userRoles.tenantId
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, jwtPayload.sub));

        const roleNames = userRoleRecords.map((r) => r.roleName) as UserRole[];

        // Recalculate tenant context
        const tenantRole = userRoleRecords.find(
            (r) => r.roleName === "SELLER_OWNER" || r.roleName === "SELLER_STAFF"
        );
        const tenantId = tenantRole?.tenantId || null;

        // Create new session with rotated tokens
        return this.createSession(
            jwtPayload.sub,
            roleNames,
            tenantId,
            session.deviceId || undefined,
            ipAddress,
            userAgent
        );
    }

    async logout(sessionId: string, actorId: string): Promise<void> {
        await db
            .update(sessions)
            .set({ status: "REVOKED", updatedAt: new Date() })
            .where(and(eq(sessions.id, sessionId), eq(sessions.userId, actorId)));

        await createAuditLog({
            actorId,
            action: "LOGOUT",
            resource: "sessions",
            resourceId: sessionId,
        });
    }

    async revokeAllSessions(userId: string): Promise<void> {
        await db
            .update(sessions)
            .set({ status: "REVOKED", updatedAt: new Date() })
            .where(
                and(eq(sessions.userId, userId), eq(sessions.status, "ACTIVE"))
            );

        await createAuditLog({
            actorId: userId,
            action: "LOGOUT",
            resource: "sessions",
            metadata: { scope: "all" },
        });
    }

    async getProfile(userId: string) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
            throw new AuthError("User not found");
        }

        const userRoleRecords = await db
            .select({ roleName: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId));

        return {
            ...user,
            roles: userRoleRecords.map((r) => r.roleName),
        };
    }
}

export const authService = new AuthService(accessJwt, refreshJwt);
