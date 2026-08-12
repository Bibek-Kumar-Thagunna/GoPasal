import type { CustomerPlanBenefits, FreeDeliveryRule } from "@/types/plan-benefits";
import { subscriptionPlans } from "@/db/schema";

type PlanRow = typeof subscriptionPlans.$inferSelect;

export function parseCustomerPlanBenefits(raw: unknown): CustomerPlanBenefits {
    if (!raw || typeof raw !== "object") return {};
    return raw as CustomerPlanBenefits;
}

function resolveFreeDeliveryRule(
    planRow: PlanRow,
    benefits: CustomerPlanBenefits
): FreeDeliveryRule {
    if (benefits.freeDelivery) return benefits.freeDelivery;
    const th = planRow.deliveryFreeThreshold
        ? Number(planRow.deliveryFreeThreshold)
        : null;
    if (th != null && th > 0) {
        return { mode: "above_subtotal_threshold", threshold: th };
    }
    return { mode: "never" };
}

export function deliveryWaivedForMember(args: {
    plan: PlanRow;
    benefits: CustomerPlanBenefits;
    itemsSubtotal: number;
}): { waived: boolean; reason: string } {
    const rule = resolveFreeDeliveryRule(args.plan, args.benefits);
    if (rule.mode === "always") {
        return { waived: true, reason: "membership_free_delivery_always" };
    }
    if (
        rule.mode === "above_subtotal_threshold" &&
        args.itemsSubtotal >= rule.threshold
    ) {
        return {
            waived: true,
            reason: `membership_free_delivery_above_${rule.threshold}`,
        };
    }
    return { waived: false, reason: "no_delivery_waiver" };
}
