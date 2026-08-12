import { db } from "@/db";
import { deviceCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BadRequestError } from "@/utils/errors";

/**
 * Biometric (WebAuthn) sign-in is not implemented yet.
 *
 * Fail-closed: every endpoint rejects with a clear message instead of
 * pretending a mock challenge/verification is secure. No mock credentials
 * are ever persisted, and no session is ever issued from this path.
 */
export class BiometricService {

    private static notAvailable(): never {
        throw new BadRequestError(
            "Biometric sign-in is not available yet. Use OTP or password to sign in."
        );
    }

    async getRegistrationOptions(userId: string): Promise<never> {
        void userId;
        return BiometricService.notAvailable();
    }

    async verifyRegistration(userId: string, body: any): Promise<never> {
        void userId;
        void body;
        return BiometricService.notAvailable();
    }

    async getLoginOptions(): Promise<never> {
        return BiometricService.notAvailable();
    }

    async verifyLogin(body: any, ip?: string): Promise<never> {
        void body;
        void ip;
        return BiometricService.notAvailable();
    }

    /**
     * Cleanup helper for deleted users (kept for schema hygiene; no-op safe).
     */
    async revokeDeviceCredentials(userId: string) {
        await db.delete(deviceCredentials).where(eq(deviceCredentials.userId, userId));
    }
}
