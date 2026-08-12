import { db } from "@/db";
import { userIdentities, users, authEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/utils";
import { AuthService } from "./auth.service";
import { BadRequestError } from "@/utils/errors";
import { verifyGoogleIdToken } from "@/integrations/google-oauth";
import { env } from "@/config/env";

export class IdentityService {
    constructor(private authService: AuthService) {}

    async verifyAndLoginSocial(
        provider: "GOOGLE" | "APPLE" | "FACEBOOK",
        token: string,
        ip?: string,
        deviceId?: string
    ) {
        const profile = await this.resolveSocialProfile(provider, token);
        if (!profile) throw new BadRequestError("Invalid Social Token");

        const [existingIdentity] = await db
            .select()
            .from(userIdentities)
            .where(
                and(
                    eq(userIdentities.provider, provider),
                    eq(userIdentities.providerId, profile.sub)
                )
            );

        let userId = existingIdentity?.userId;

        if (!userId) {
            const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, profile.email));

            if (existingUser) {
                userId = existingUser.id;
            } else {
                userId = generateId();
                await db.insert(users).values({
                    id: userId,
                    email: profile.email,
                    name: profile.name,
                    phone: `social_${generateId()}`,
                    isPhoneVerified: false,
                    avatarUrl: profile.picture,
                    googleId: provider === "GOOGLE" ? profile.sub : undefined,
                });
            }

            await db.insert(userIdentities).values({
                id: `id_${generateId()}`,
                userId,
                provider,
                providerId: profile.sub,
                email: profile.email,
                verifiedAt: new Date(),
            });

            await db.insert(authEvents).values({
                id: `evt_${generateId()}`,
                userId,
                eventType: "LINK",
                metadata: { provider },
                ipAddress: ip,
            });
        }

        const userProfile = await this.authService.getProfile(userId);
        const tokens = await this.authService.createSession(
            userId,
            userProfile.roles as never[],
            null,
            deviceId,
            ip,
            "Social Login"
        );

        return { user: userProfile, tokens };
    }

    private async resolveSocialProfile(
        provider: "GOOGLE" | "APPLE" | "FACEBOOK",
        token: string
    ): Promise<{
        sub: string;
        email: string;
        name: string;
        picture?: string;
    } | null> {
        if (provider === "GOOGLE" && env.GOOGLE_CLIENT_ID?.trim()) {
            const verified = await verifyGoogleIdToken(token);
            if (!verified) return null;
            return verified;
        }

        if (provider === "GOOGLE") {
            throw new BadRequestError(
                "Google sign-in is not configured. Contact support."
            );
        }

        // Apple / Facebook are not wired to a provider yet — fail closed.
        throw new BadRequestError(
            `${provider.charAt(0) + provider.slice(1).toLowerCase()} sign-in is not available yet.`
        );
    }
}
