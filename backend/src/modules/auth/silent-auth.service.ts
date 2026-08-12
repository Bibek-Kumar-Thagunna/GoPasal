import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuthService } from "./auth.service";

export class SilentAuthService {
    constructor(private authService: AuthService) { }

    async verifySilent(phone: string, mobileToken: string, ip?: string) {
        // Tier 1: Carrier Verification (Simulated)
        // If mobileToken starts with "valid_", we assume carrier verified it matches phone

        let verified = false;
        if (mobileToken.startsWith("valid_")) {
            verified = true;
        }

        if (!verified) {
            return { success: false, action: "FALLBACK_OTP" };
        }

        // Tier 1 Success -> Login
        let [user] = await db.select().from(users).where(eq(users.phone, phone));

        if (!user) {
            // Auto-register? Or require OTP for first time?
            // Safer to require OTP for registration.
            return { success: false, action: "FALLBACK_OTP_REGISTER" };
        }

        const profile = await this.authService.getProfile(user.id);
        const tokens = await this.authService.createSession(
            user.id,
            profile.roles as any,
            null,
            "silent_auth_device",
            ip,
            "Silent Auth"
        );

        return { success: true, user: profile, tokens };
    }
}
