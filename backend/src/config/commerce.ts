/**
 * Platform commerce defaults — tune per geography / launch.
 */
/** Reserved store id for platform-funded coupons (first-order / acquisition promos). */
export const PLATFORM_PROMO_STORE_ID =
    process.env.GOPASAL_PLATFORM_PROMO_STORE_ID ?? "store_platform_promos";

export const COMMERCE = {
    /** Flat merchant-delivery surcharge added at checkout until dynamic zones launch. NPR. */
    MERCHANT_DELIVERY_FLAT_AMOUNT: Number(
        process.env.GOPASAL_MERCHANT_DELIVERY_FLAT ?? "49"
    ),
    /** Loyalty earn: percent of eligible subtotal (after discounts) for members — optional booster in plan benefits overrides. */
    DEFAULT_LOYALTY_EARN_PERCENT: 1,
} as const;
