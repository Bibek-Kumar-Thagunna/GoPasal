import {describe, expect, it, spyOn, mock, afterAll} from "bun:test";
import { IdentityService } from "@/modules/auth/identity.service";
import { SilentAuthService } from "@/modules/auth/silent-auth.service";
import { AuthService } from "@/modules/auth/auth.service";
import { db } from "@/db";

describe("Modern Auth", () => {

    afterAll(() => {
        mock.restore();
    });
    // Mocks
    const mockAuthService = {
        getProfile: async () => ({ id: "u1", roles: ["CUSTOMER"] }),
        createSession: async () => ({ accessToken: "at", refreshToken: "rt" })
    } as unknown as AuthService;

    // Spy on DB
    spyOn(db, 'insert').mockReturnValue({ values: () => Promise.resolve() } as any);
    spyOn(db, 'select').mockReturnValue({ from: () => ({ where: () => Promise.resolve([]) }) } as any); // Default empty

    it("should link social identity and login", async () => {
        const identityService = new IdentityService(mockAuthService);
        // Mock DB to return nothing (User not found -> Create)
        spyOn(db, 'select').mockReturnValue({ from: () => ({ where: () => Promise.resolve([]) }) } as any);

        // Google sign-in requires the client id to be configured; the token is
        // verified server-side against Google.
        const { env } = await import("@/config/env");
        (env as { GOOGLE_CLIENT_ID: string }).GOOGLE_CLIENT_ID = "test-client-id";
        const googleOauth = await import("@/integrations/google-oauth");
        spyOn(googleOauth as never, "verifyGoogleIdToken").mockResolvedValue({
            sub: "sub_google_1",
            email: "google1@example.com",
            name: "Google User",
        } as never);

        const res = await identityService.verifyAndLoginSocial("GOOGLE", "valid_token");
        expect(res.tokens.accessToken).toBe("at");
    });

    it("should fallback to OTP for failed silent auth", async () => {
        const silentService = new SilentAuthService(mockAuthService);
        const res = await silentService.verifySilent("+977111", "invalid_token");
        expect(res.success).toBe(false);
        expect(res.action).toBe("FALLBACK_OTP");
    });
});
