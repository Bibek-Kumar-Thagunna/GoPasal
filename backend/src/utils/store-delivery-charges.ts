export type StoreDeliveryChargeMeta = {
    deliveryFee?: number | string;
    freeDeliveryThreshold?: number | string;
    freeDelivery?: boolean;
};

function parseAmount(value: number | string | null | undefined): number | null {
    if (value == null || value === "") return null;
    const parsed = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

/**
 * Delivery fee charged at checkout from store metadata (seller settings).
 * Returns 0 when pickup, free delivery, threshold met, or shop has not configured a fee.
 */
export function resolveStoreDeliveryFee(
    metadata: unknown,
    itemsSubtotal: number,
    needsDelivery: boolean
): number {
    if (!needsDelivery) return 0;

    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        return 0;
    }

    const meta = metadata as StoreDeliveryChargeMeta;
    if (meta.freeDelivery === true) {
        return 0;
    }

    const configuredFee = parseAmount(meta.deliveryFee);
    if (configuredFee == null) {
        return 0;
    }

    if (configuredFee === 0) {
        return 0;
    }

    const freeThreshold = parseAmount(meta.freeDeliveryThreshold);
    if (freeThreshold != null && freeThreshold > 0 && itemsSubtotal >= freeThreshold) {
        return 0;
    }

    return configuredFee;
}

export function readConfiguredStoreDeliveryFee(metadata: unknown): number | null {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        return null;
    }
    const meta = metadata as StoreDeliveryChargeMeta;
    if (meta.freeDelivery === true) return 0;
    return parseAmount(meta.deliveryFee);
}
