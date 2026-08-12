import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { FeatureFlagContext, FeatureFlagRule } from "./types";

export class FeatureFlagService {

    // Evaluate all flags for a context (Client SDK)
    async evaluateAll(context: FeatureFlagContext) {
        const allFlags = await db.select().from(featureFlags).where(eq(featureFlags.env, "production")); // Naive env check
        const result: Record<string, boolean> = {};

        for (const flag of allFlags) {
            if (!flag.clientSide) continue;
            result[flag.key] = this.evaluate(flag, context);
        }
        return result;
    }

    // Core Evaluation Logic
    evaluate(flag: typeof featureFlags.$inferSelect, context: FeatureFlagContext): boolean {
        // 1. Global Kill Switch
        if (!flag.isEnabled) return false;

        // 2. Rules Processing
        if (flag.rules && Array.isArray(flag.rules) && flag.rules.length > 0) {
            for (const rule of flag.rules as FeatureFlagRule[]) {
                if (this.matchesRule(rule, context)) {
                    // Rule matched, check rollout
                    if (rule.percentage === 100) return true;
                    if (rule.percentage === 0) return false;
                    return this.isInSample(flag.key, context.userId || "anon", rule.percentage);
                }
            }
            // If rules exist but none match, what is default? Usually false if rules are restrictive. 
            // Or true if isEnabled is true? LaunchDarkly usually has "Fallthrough".
            // Let's assume if isEnabled is TRUE, it means "On for everyone unless rules say otherwise" OR "On for no one except rules"?
            // Convention: verified Feature Flag tools usually have "Default Rule".
            // Implementation: If isEnabled=true, we treat it as "Base On", but rules can refine targeting.
            // Simplified: If rules exist, they are "Targeting specific users". If no rules match -> Fallback to isEnabled?
            // Actually, if isEnabled=false, it returns false immediately.
            // If isEnabled=true, and rules exist, we check rules. If no rule matches, we return TRUE (Base state).
            // Wait, usually "Targeting" means "Only these people".
            // Let's stick to: isEnabled=Master Switch. If ON, check rules. If no rule matches -> Return TRUE via base rollout? 
            // For MVP: If isEnabled is true, return true. Rules are actually "Segment Overrides" usually.
            // Let's refine: Rules are "Targeting". matchesRule -> returns specific outcome.

            // Let's go with: isEnabled = Global ON. Rules = specific overrides? No, usually rules are the *only* way to turn it on for specific subsets if Global is OFF.
            // Correct LD Model:
            // ON/OFF Switch. If OFF -> False.
            // If ON -> Check Rules. If Rule Match -> Serve Rule Variation.
            // If No Rule Match -> Serve Default Variation (True).

            return true;
        }

        return flag.isEnabled;
    }

    private matchesRule(rule: FeatureFlagRule, context: FeatureFlagContext): boolean {
        // AND logic for conditions
        for (const condition of rule.conditions) {
            const value = context[condition.attribute];
            if (!value) return false; // Context missing attribute

            switch (condition.operator) {
                case "equals":
                    if (value !== condition.value) return false;
                    break;
                case "contains":
                    if (!(value as string).includes(condition.value as string)) return false;
                    break;
                case "in":
                    if (!Array.isArray(condition.value)) return false;
                    if (!(condition.value as any[]).includes(value)) return false;
                    break;
                // Add more operators
                default:
                    return false;
            }
        }
        return true;
    }

    private isInSample(key: string, userId: string, percentage: number): boolean {
        // Deterministic Hashing: hash(key + userId) % 100
        const hash = createHash("sha1").update(`${key}:${userId}`).digest("hex");
        const intVal = parseInt(hash.substring(0, 8), 16);
        return (intVal % 100) < percentage;
    }
}

export const featureFlagService = new FeatureFlagService();
