import { env } from "@/config/env";
import { logger } from "@/shared/logger";

export type GoogleProfile = {
    sub: string;
    email: string;
    name: string;
    picture?: string;
};

type TokenInfoResponse = {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    aud?: string;
    email_verified?: string;
    error_description?: string;
};

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
    const clientId = env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
        logger.warn("GOOGLE_CLIENT_ID not set — Google sign-in disabled");
        return null;
    }

    const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;

    const data = (await res.json()) as TokenInfoResponse;
    if (data.aud !== clientId) return null;
    if (!data.sub || !data.email) return null;
    if (data.email_verified === "false") return null;

    return {
        sub: data.sub,
        email: data.email.toLowerCase(),
        name: data.name ?? data.email.split("@")[0] ?? "User",
        picture: data.picture,
    };
}
