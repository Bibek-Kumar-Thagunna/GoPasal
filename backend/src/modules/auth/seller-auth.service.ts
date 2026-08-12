import { db } from "@/db";
import { users, sessions, roles, userRoles, otps, stores } from "@/db/schema";
import { eq, and, gt, desc, isNull } from "drizzle-orm";
import { env, AUTH } from "@/config";
import {
    generateId,
    generateOTP,
    hashPassword,
    verifyPassword,
    logger,
    AuthError,
} from "@/utils";
import { createAuditLog } from "@/shared";
import type { TokenPair, JWTPayload, UserRole } from "@/types";
import { storeService } from "@/modules/seller/store/store.service";

export async function assertPendingRegistrationOtp(phone: string): Promise<void> {
    const [otpRecord] = await db
        .select()
        .from(otps)
        .where(
            and(
                eq(otps.phone, phone),
                gt(otps.expiresAt, new Date()),
                isNull(otps.usedAt)
            )
        )
        .orderBy(desc(otps.createdAt))
        .limit(1);

    if (!otpRecord) {
        throw new AuthError(
            "Phone verification expired. Go back and request a new OTP before uploading documents."
        );
    }
}

function registrationSubject(phone: string): string {
    return `reg:${phone}`;
}

export function phoneFromRegistrationSubject(sub: string): string | null {
    if (!sub.startsWith("reg:")) return null;
    const phone = sub.slice(4).trim();
    return phone || null;
}

export class SellerAuthService {
    constructor(
        private accessJwt: { sign: (payload: any) => Promise<string>; verify: (token: string) => Promise<any> },
        private refreshJwt: { sign: (payload: any) => Promise<string>; verify: (token: string) => Promise<any> }
    ) {}

    /**
     * Step 1: Validate uniqueness of email/phone and send OTP.
     * Does NOT create any user record in the database.
     */
    /** Confirms OTP during onboarding; returns short-lived token for KYC uploads (does not create user). */
    async confirmRegistrationOtp(phone: string, otp: string): Promise<{ registrationToken: string }> {
        await this.verifyRegistrationOtpCode(phone, otp, { consume: false });
        const registrationToken = await this.accessJwt.sign({
            sub: registrationSubject(phone),
            roles: [],
            tenantId: null,
            sessionId: generateId(),
            type: "registration",
        } as JWTPayload);
        return { registrationToken };
    }

    private async verifyRegistrationOtpCode(
        phone: string,
        otp: string,
        opts: { consume: boolean }
    ): Promise<void> {
        const [otpRecord] = await db
            .select()
            .from(otps)
            .where(and(eq(otps.phone, phone), gt(otps.expiresAt, new Date())))
            .orderBy(desc(otps.createdAt))
            .limit(1);

        if (!otpRecord) {
            throw new AuthError("OTP expired or not found. Please register again.");
        }

        if (otpRecord.usedAt) {
            throw new AuthError("OTP already used. Please register again.");
        }

        const attempts = parseInt(otpRecord.attempts, 10);
        if (attempts >= AUTH.MAX_OTP_ATTEMPTS) {
            throw new AuthError("Maximum OTP attempts exceeded. Please register again.");
        }

        const isValid = await verifyPassword(otp, otpRecord.otpHash);

        await db
            .update(otps)
            .set({ attempts: String(attempts + 1) })
            .where(eq(otps.id, otpRecord.id));

        if (!isValid) {
            throw new AuthError("Invalid OTP code");
        }

        if (opts.consume) {
            await db
                .update(otps)
                .set({ usedAt: new Date() })
                .where(eq(otps.id, otpRecord.id));
        }
    }

    async validateAndSendOtp(data: {
        name: string;
        email: string;
        phone: string;
        password: string;
    }): Promise<{ message: string; expiresIn: number }> {
        // Check existing user by email
        const [existingByEmail] = await db
            .select()
            .from(users)
            .where(eq(users.email, data.email))
            .limit(1);

        if (existingByEmail) {
            const [store] = await db.select().from(stores).where(eq(stores.ownerId, existingByEmail.id));
            if (store && store.verificationStep === 'REJECTED') {
                await db.delete(stores).where(eq(stores.ownerId, existingByEmail.id));
                await db.delete(users).where(eq(users.id, existingByEmail.id));
            } else {
                throw new AuthError("This email is already registered. Please log in instead.");
            }
        }

        // Check existing user by phone
        const [existingByPhone] = await db
            .select()
            .from(users)
            .where(eq(users.phone, data.phone))
            .limit(1);

        if (existingByPhone) {
            const [store] = await db.select().from(stores).where(eq(stores.ownerId, existingByPhone.id));
            if (store && store.verificationStep === 'REJECTED') {
                await db.delete(stores).where(eq(stores.ownerId, existingByPhone.id));
                await db.delete(users).where(eq(users.id, existingByPhone.id));
            } else {
                throw new AuthError("This phone number is already registered. Please log in instead.");
            }
        }

        // Generate and store OTP (only the OTP record, NOT a user)
        const otp = generateOTP();
        const otpHash = await hashPassword(otp);
        const registrationTtl = env.SELLER_REGISTRATION_OTP_EXPIRY_SECONDS;
        const expiresAt = new Date(Date.now() + registrationTtl * 1000);

        await db.insert(otps).values({
            id: generateId(),
            phone: data.phone,
            otpHash,
            expiresAt,
        });

        if (env.NODE_ENV === "development") {
            logger.info(`[DEV] Registration OTP for ${data.phone}: ${otp}`);
        }

        return {
            message: "OTP sent successfully",
            expiresIn: registrationTtl,
        };
    }

    /**
     * Final step: Verify OTP, create user, assign role, create session, return tokens.
     * This is the ONLY place where user data is persisted to the database.
     */
    async completeRegistration(data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        otp: string;
        category?: string;
        businessName?: string;
        businessAddress?: string;
        panVat?: string;
        businessRegDoc?: string;
        storeLicense?: string;
        storePhotos?: string[];
    }, ipAddress?: string, userAgent?: string): Promise<{ user: typeof users.$inferSelect; tokens: TokenPair }> {
        // Re-validate uniqueness (race condition safety)
        const [existingByEmail] = await db
            .select().from(users).where(eq(users.email, data.email)).limit(1);
        if (existingByEmail) {
            const [store] = await db.select().from(stores).where(eq(stores.ownerId, existingByEmail.id));
            if (store && store.verificationStep === 'REJECTED') {
                await db.delete(stores).where(eq(stores.ownerId, existingByEmail.id));
                await db.delete(users).where(eq(users.id, existingByEmail.id));
            } else {
                throw new AuthError("This email is already registered.");
            }
        }

        const [existingByPhone] = await db
            .select().from(users).where(eq(users.phone, data.phone)).limit(1);
        if (existingByPhone) {
            const [store] = await db.select().from(stores).where(eq(stores.ownerId, existingByPhone.id));
            if (store && store.verificationStep === 'REJECTED') {
                await db.delete(stores).where(eq(stores.ownerId, existingByPhone.id));
                await db.delete(users).where(eq(users.id, existingByPhone.id));
            } else {
                throw new AuthError("This phone number is already registered.");
            }
        }

        await this.verifyRegistrationOtpCode(data.phone, data.otp, { consume: true });

        // NOW create the user
        const userId = generateId();
        const passwordHash = await hashPassword(data.password);

        const [user] = await db
            .insert(users)
            .values({
                id: userId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                passwordHash,
                isPhoneVerified: true,
            })
            .returning();

        // Assign SELLER_OWNER role
        const [sellerRole] = await db
            .select()
            .from(roles)
            .where(eq(roles.name, "SELLER_OWNER"));

        if (sellerRole) {
            await db.insert(userRoles).values({
                userId,
                roleId: sellerRole.id,
            });
        }

        await createAuditLog({
            actorId: userId,
            action: "CREATE",
            resource: "users",
            resourceId: userId,
            afterState: {
                name: data.name,
                email: data.email,
                method: "seller_register",
                category: data.category,
                businessName: data.businessName,
            },
        });

        // Create the store record with KYC details
        if (data.businessName) {
            const storeId = generateId();
            const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
            
            await db.insert(stores).values({
                id: storeId,
                ownerId: userId,
                name: data.businessName,
                slug: slug,
                storeCategoryId: data.category,
                address: data.businessAddress,
                kycBusinessName: data.businessName,
                kycPanVat: data.panVat,
                kycAddress: data.businessAddress,
                kycDocumentUrl: data.businessRegDoc,
                kycStoreLicenseUrl: data.storeLicense,
                kycStorePhotos: data.storePhotos || [],
                kycStatus: "PENDING",
                verificationStep: "UNDER_REVIEW",
                verificationSubmittedAt: new Date(),
                status: "PENDING_APPROVAL",
                isOpen: false,
            });

            // Make sure tenantId is tied to role
            if (sellerRole) {
                await db.update(userRoles).set({ tenantId: storeId }).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, sellerRole.id)));
            }
        }

        // Create session
        const tokens = await this.createSession(
            userId,
            ["SELLER_OWNER"] as UserRole[],
            null,
            undefined,
            ipAddress,
            userAgent
        );

        await createAuditLog({
            actorId: userId,
            action: "LOGIN",
            resource: "sessions",
            metadata: { method: "registration_complete" },
            ipAddress,
        });

        return { user, tokens };
    }

    async login(
        email: string,
        password: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ user: typeof users.$inferSelect; tokens: TokenPair }> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            throw new AuthError("Invalid email or password");
        }

        if (!user.isPhoneVerified) {
            throw new AuthError("Phone number is not verified. Please complete registration.");
        }

        if (!user.passwordHash) {
            throw new AuthError("Account uses OTP login. Please use phone login.");
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            throw new AuthError("Invalid email or password");
        }

        // Update last login
        await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

        // Get user roles
        const userRoleRecords = await db
            .select({
                roleName: roles.name,
                tenantId: userRoles.tenantId,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, user.id));

        const roleNames = userRoleRecords.map((r) => r.roleName) as UserRole[];
        const tenantId = await this.resolveSellerTenantId(user.id, userRoleRecords);

        const tokens = await this.createSession(
            user.id,
            roleNames,
            tenantId,
            undefined,
            ipAddress,
            userAgent
        );

        await createAuditLog({
            actorId: user.id,
            action: "LOGIN",
            resource: "sessions",
            metadata: { method: "email_password" },
            ipAddress,
        });

        return { user, tokens };
    }

    /** JWT tenant = store id; backfill user_roles when store exists but tenant_id was never set. */
    private async resolveSellerTenantId(
        userId: string,
        userRoleRecords: { roleName: string; tenantId: string | null }[]
    ): Promise<string | null> {
        const sellerRole = userRoleRecords.find(
            (r) => r.roleName === "SELLER_OWNER" || r.roleName === "SELLER_STAFF"
        );
        if (sellerRole?.tenantId) return sellerRole.tenantId;

        const primaryStore = await storeService.getPrimaryOwnedStore(userId);
        if (!primaryStore) return null;

        if (sellerRole) {
            const [sellerRoleRow] = await db
                .select({ id: roles.id })
                .from(roles)
                .where(eq(roles.name, sellerRole.roleName))
                .limit(1);
            if (sellerRoleRow) {
                await db
                    .update(userRoles)
                    .set({ tenantId: primaryStore.id })
                    .where(
                        and(
                            eq(userRoles.userId, userId),
                            eq(userRoles.roleId, sellerRoleRow.id)
                        )
                    );
            }
        }

        return primaryStore.id;
    }

    async googleAuth(data: {
        googleId: string;
        email: string;
        name: string;
        avatarUrl?: string;
    }): Promise<{ user: typeof users.$inferSelect; tokens: TokenPair; isNew: boolean }> {
        let [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, data.email))
            .limit(1);

        let isNew = false;

        if (!user) {
            const userId = generateId();
            [user] = await db
                .insert(users)
                .values({
                    id: userId,
                    name: data.name,
                    email: data.email,
                    phone: `google_${data.googleId}`,
                    googleId: data.googleId,
                    avatarUrl: data.avatarUrl,
                    isPhoneVerified: false,
                })
                .returning();

            const [sellerRole] = await db
                .select()
                .from(roles)
                .where(eq(roles.name, "SELLER_OWNER"));

            if (sellerRole) {
                await db.insert(userRoles).values({
                    userId,
                    roleId: sellerRole.id,
                });
            }

            isNew = true;
        } else if (!user.googleId) {
            await db
                .update(users)
                .set({ googleId: data.googleId })
                .where(eq(users.id, user.id));
        }

        const userRoleRecords = await db
            .select({ roleName: roles.name, tenantId: userRoles.tenantId })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, user.id));

        const roleNames = userRoleRecords.map((r) => r.roleName) as UserRole[];
        const tenantId = await this.resolveSellerTenantId(user.id, userRoleRecords);

        const tokens = await this.createSession(user.id, roleNames, tenantId);

        return { user, tokens, isNew };
    }

    async switchStore(
        userId: string,
        storeId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<TokenPair> {
        await storeService.assertUserCanAccessStore(userId, storeId);

        const userRoleRecords = await db
            .select({
                roleName: roles.name,
                tenantId: userRoles.tenantId,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId));

        const roleNames = userRoleRecords.map((r) => r.roleName) as UserRole[];
        const tokens = await this.createSession(
            userId,
            roleNames,
            storeId,
            undefined,
            ipAddress,
            userAgent
        );

        await createAuditLog({
            actorId: userId,
            action: "SWITCH_STORE",
            resource: "sessions",
            metadata: { storeId },
            ipAddress,
        });

        return tokens;
    }

    private async createSession(
        userId: string,
        roles: UserRole[],
        tenantId: string | null,
        deviceId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<TokenPair> {
        const sessionId = generateId();

        const accessPayload: JWTPayload = {
            sub: userId,
            roles,
            tenantId,
            sessionId,
            type: "access",
        };

        const refreshPayload: JWTPayload = {
            sub: userId,
            roles,
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
}
