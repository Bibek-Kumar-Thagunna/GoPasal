import { db } from "@/db";
import { policyViolations } from "@/db/schema";
import { generateId } from "@/utils";
import { createAuditLog } from "@/shared";
import { PolicyRules, PolicyContext } from "./definitions";

export interface PolicyResult {
    allowed: boolean;
    reason?: string;
    action?: "BLOCK" | "FLAG";
}

export class PolicyService {

    async evaluate(context: PolicyContext): Promise<PolicyResult> {
        const rules = Object.values(PolicyRules);

        for (const rule of rules) {
            try {
                const result = await rule(context);
                if (result !== true) {
                    // Violation!
                    await this.logViolation(context, typeof result === "string" ? result : "Policy Violation");

                    return {
                        allowed: false,
                        reason: typeof result === "string" ? result : "Policy Violation",
                        action: "BLOCK"
                    };
                }
            } catch (error) {
                console.error("Policy Engine Error:", error);
                // Fail Safe: If checking fails, we usually Block or Log. 
                // For MVP, Block to be safe if it's a critical error, or Allow if it's just DB glitch?
                // SRS: "Fail-Safe Deny"
                return { allowed: false, reason: "System Error during Policy Check", action: "BLOCK" };
            }
        }

        return { allowed: true };
    }

    private async logViolation(ctx: PolicyContext, reason: string) {
        const violationId = generateId();
        await db.insert(policyViolations).values({
            id: violationId,
            actorId: ctx.actorId,
            policyType: ctx.type,
            reason: reason,
            resource: ctx.type === "PRODUCT" ? "products" : ctx.type === "ORDER" ? "orders" : "refunds",
            metadata: { input: ctx.data }
        });

        // Optional: Audit Log specific event
        // violation table is specific enough, but audit log unifies view.
        // Let's rely on violation table for now.
    }

    async getLatestPolicy(category: string) {
        // Mock Implementation
        return {
            id: `pol_${generateId()}`,
            version: "1.0",
            content: "Policy Content",
            category
        };
    }

    async recordConsent(userId: string, policyId: string, ip: string, ua: string) {
        // Mock Implementation
        await createAuditLog({
            actorId: userId,
            action: "AGREE_POLICY",
            resource: "policies",
            resourceId: policyId,
            metadata: { ip, ua }
        });
        return { success: true };
    }
}

export const policyService = new PolicyService();
