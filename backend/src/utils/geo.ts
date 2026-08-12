import { normalizeStoreDeliveryMode } from "@/modules/fulfillment/fulfillment";

export const DEFAULT_DELIVERY_RADIUS_KM = 3;
export const PICKUP_DISCOVERY_RADIUS_KM = 25;

export function isWithinRadius(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusKm: number
): boolean {
    return haversineDistanceKm(lat1, lon1, lat2, lon2) <= radiusKm;
}

export function haversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function effectiveServiceRadiusKm(
    deliveryType: string | null | undefined,
    deliveryRadius: number | null | undefined
): number {
    const mode = normalizeStoreDeliveryMode(deliveryType);
    if (mode === "PICKUP_ONLY") {
        return PICKUP_DISCOVERY_RADIUS_KM;
    }
    const radius = deliveryRadius ?? DEFAULT_DELIVERY_RADIUS_KM;
    if (!Number.isFinite(radius) || radius <= 0) {
        return DEFAULT_DELIVERY_RADIUS_KM;
    }
    return Math.min(50, Math.max(0.5, radius));
}

export type DeliveryServiceabilityInput = {
    storeLatitude: number | null | undefined;
    storeLongitude: number | null | undefined;
    storeDeliveryRadius: number | null | undefined;
    storeDeliveryType: string | null | undefined;
    customerLatitude: number;
    customerLongitude: number;
    /** When false, only validates that the shop has coordinates (pickup orders). */
    enforceDeliveryRadius?: boolean;
};

export type DeliveryServiceabilityResult =
    | {
          ok: true;
          distanceKm: number;
          maxRadiusKm: number;
      }
    | {
          ok: false;
          code: "STORE_LOCATION_MISSING" | "OUT_OF_DELIVERY_AREA";
          message: string;
          distanceKm?: number;
          maxRadiusKm?: number;
      };

export function checkDeliveryServiceability(
    input: DeliveryServiceabilityInput
): DeliveryServiceabilityResult {
    const { storeLatitude, storeLongitude, customerLatitude, customerLongitude } = input;

    if (
        storeLatitude == null ||
        storeLongitude == null ||
        !Number.isFinite(storeLatitude) ||
        !Number.isFinite(storeLongitude)
    ) {
        return {
            ok: false,
            code: "STORE_LOCATION_MISSING",
            message: "This shop has not set a delivery location yet. Try another store.",
        };
    }

    const distanceKm = haversineDistanceKm(
        storeLatitude,
        storeLongitude,
        customerLatitude,
        customerLongitude
    );

    const maxRadiusKm = effectiveServiceRadiusKm(
        input.storeDeliveryType,
        input.storeDeliveryRadius
    );

    const enforce = input.enforceDeliveryRadius !== false;
    const mode = normalizeStoreDeliveryMode(input.storeDeliveryType);

    if (enforce && mode !== "PICKUP_ONLY" && distanceKm > maxRadiusKm) {
        return {
            ok: false,
            code: "OUT_OF_DELIVERY_AREA",
            message: `This shop delivers within ${maxRadiusKm} km. Your address is about ${distanceKm.toFixed(1)} km away.`,
            distanceKm,
            maxRadiusKm,
        };
    }

    return { ok: true, distanceKm, maxRadiusKm };
}
