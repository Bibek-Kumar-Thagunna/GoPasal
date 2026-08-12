/**
 * Fulfillment model:
 * - **Store delivery mode** (`stores.delivery_type`): how the shop is configured to fulfill.
 * - **Order fulfillment type** (`orders.fulfillment_type`): what the buyer chose at checkout.
 *
 * Launch default: shops deliver themselves (`MERCHANT_SELF` + `MERCHANT_DELIVERY`).
 * Platform fleet (`PLATFORM` + `PLATFORM_LOGISTICS`) is wired for a later rollout.
 */

export const STORE_DELIVERY_MODES = [
    "MERCHANT_SELF",
    "PLATFORM",
    "PICKUP_ONLY",
    "HYBRID",
] as const;

export type StoreDeliveryMode = (typeof STORE_DELIVERY_MODES)[number];

export const ORDER_FULFILLMENT_TYPES = [
    "MERCHANT_DELIVERY",
    "PICKUP",
    "PLATFORM_LOGISTICS",
] as const;

export type OrderFulfillmentType = (typeof ORDER_FULFILLMENT_TYPES)[number];

export type CheckoutFulfillmentRequest = "MERCHANT_DELIVERY" | "PICKUP" | "PLATFORM_LOGISTICS";

const LEGACY_STORE_MODE: Record<string, StoreDeliveryMode> = {
    SELF: "MERCHANT_SELF",
    MERCHANT: "MERCHANT_SELF",
    MERCHANT_SELF: "MERCHANT_SELF",
    PLATFORM: "PLATFORM",
    PICKUP_ONLY: "PICKUP_ONLY",
    HYBRID: "HYBRID",
};

export function normalizeStoreDeliveryMode(raw: string | null | undefined): StoreDeliveryMode {
    const key = (raw ?? "MERCHANT_SELF").trim().toUpperCase();
    return LEGACY_STORE_MODE[key] ?? "MERCHANT_SELF";
}

export function storeSupportsPickup(mode: StoreDeliveryMode): boolean {
    return mode === "MERCHANT_SELF" || mode === "HYBRID" || mode === "PICKUP_ONLY";
}

export function storeSupportsMerchantDelivery(mode: StoreDeliveryMode): boolean {
    return mode === "MERCHANT_SELF" || mode === "HYBRID";
}

export function storeSupportsPlatformLogistics(mode: StoreDeliveryMode): boolean {
    return mode === "PLATFORM" || mode === "HYBRID";
}

/** Stores that deliver to an address should enforce shop radius at checkout. */
export function storeRequiresDeliveryRadiusCheck(mode: StoreDeliveryMode): boolean {
    return mode === "MERCHANT_SELF" || mode === "PLATFORM" || mode === "HYBRID";
}

/** Default checkout option when the client does not send fulfillmentType. */
export function defaultCheckoutFulfillment(mode: StoreDeliveryMode): CheckoutFulfillmentRequest {
    if (mode === "PICKUP_ONLY") return "PICKUP";
    if (mode === "PLATFORM") return "PLATFORM_LOGISTICS";
    return "MERCHANT_DELIVERY";
}

/**
 * Maps store configuration + buyer choice to persisted order.fulfillment_type.
 */
export function resolveOrderFulfillmentType(
    storeMode: StoreDeliveryMode,
    requested: CheckoutFulfillmentRequest | undefined
): OrderFulfillmentType {
    const choice = requested ?? defaultCheckoutFulfillment(storeMode);

    if (choice === "PICKUP") {
        if (!storeSupportsPickup(storeMode)) {
            throw new Error("PICKUP_NOT_AVAILABLE");
        }
        return "PICKUP";
    }

    if (choice === "PLATFORM_LOGISTICS") {
        if (!storeSupportsPlatformLogistics(storeMode)) {
            throw new Error("PLATFORM_LOGISTICS_NOT_AVAILABLE");
        }
        return "PLATFORM_LOGISTICS";
    }

    // MERCHANT_DELIVERY request
    if (storeMode === "PLATFORM") {
        return "PLATFORM_LOGISTICS";
    }
    if (storeMode === "PICKUP_ONLY") {
        throw new Error("DELIVERY_NOT_AVAILABLE");
    }
    return "MERCHANT_DELIVERY";
}

export function shouldCreatePlatformDeliveryTask(fulfillmentType: OrderFulfillmentType): boolean {
    return fulfillmentType === "PLATFORM_LOGISTICS";
}

export function isMerchantHandledFulfillment(fulfillmentType: OrderFulfillmentType): boolean {
    return fulfillmentType === "MERCHANT_DELIVERY" || fulfillmentType === "PICKUP";
}

export function fulfillmentTypeLabel(type: OrderFulfillmentType): string {
    switch (type) {
        case "PICKUP":
            return "Store pickup";
        case "PLATFORM_LOGISTICS":
            return "Platform delivery";
        case "MERCHANT_DELIVERY":
        default:
            return "Merchant delivery";
    }
}

export function storeDeliveryModeLabel(mode: StoreDeliveryMode): string {
    switch (mode) {
        case "MERCHANT_SELF":
            return "Merchant delivers";
        case "PLATFORM":
            return "Platform fleet (when enabled)";
        case "PICKUP_ONLY":
            return "Pickup only";
        case "HYBRID":
            return "Merchant + platform options";
        default:
            return mode;
    }
}

export function assertValidStoreDeliveryMode(mode: string): StoreDeliveryMode {
    const normalized = normalizeStoreDeliveryMode(mode);
    if (!STORE_DELIVERY_MODES.includes(normalized)) {
        throw new Error("INVALID_STORE_DELIVERY_MODE");
    }
    return normalized;
}
