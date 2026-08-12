/**
 * JSON stored in subscription_plans.benefits and store_marketing_plans.benefits.
 */
export type FreeDeliveryRule =
    | { mode: "never" }
    | { mode: "always" }
    | { mode: "above_subtotal_threshold"; threshold: number };

export type CustomerPlanBenefits = {
    /** Free delivery policy (threshold in same currency as order subtotal before delivery). */
    freeDelivery?: FreeDeliveryRule;
    /** Extra loyalty points multiplier on earn (e.g. 1.25 = +25%). */
    loyaltyEarnMultiplier?: number;
    /** Optional platform/service fee waive percent 0–100 — future use when fee line exists in checkout. */
    platformFeeWaivePercent?: number;
};

export type StoreMarketingBenefits = {
    /** Subtract from commission % at order snapshot (basis points): 75 = −0.75 percentage points off rate. */
    commissionDiscountBps?: number;
    /** Multiplier blended into search/ad ranking boosts (catalog service reads this later). */
    searchBoostMultiplier?: number;
    /** Featured slots budget per month — ops / ad engine. */
    monthlyFeaturedListingSlots?: number;
    /** Free or discounted boosted listing credits. */
    monthlyPromotionalBoostCredits?: number;
    analyticsPro?: boolean;
};
