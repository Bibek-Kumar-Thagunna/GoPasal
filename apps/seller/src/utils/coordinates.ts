const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;
const RADIUS_MIN_KM = 0.5;
const RADIUS_MAX_KM = 50;

export function parseCoordinateInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidLatitude(lat: number): boolean {
  return lat >= LAT_MIN && lat <= LAT_MAX;
}

export function isValidLongitude(lon: number): boolean {
  return lon >= LON_MIN && lon <= LON_MAX;
}

export function isValidDeliveryRadiusKm(km: number): boolean {
  return km >= RADIUS_MIN_KM && km <= RADIUS_MAX_KM;
}

export function formatCoordinate(value: number | null | undefined, decimals = 5): string {
  if (value == null || !Number.isFinite(value)) return '';
  return value.toFixed(decimals);
}

export function clampDeliveryRadiusKm(km: number): number {
  return Math.min(RADIUS_MAX_KM, Math.max(RADIUS_MIN_KM, km));
}

export const DELIVERY_RADIUS_PRESETS_KM = [1, 2, 3, 5, 10, 15] as const;

export const COORDINATE_LIMITS = {
  RADIUS_MIN_KM,
  RADIUS_MAX_KM,
} as const;

export type GeoValidationResult =
  | { ok: true; latitude?: number; longitude?: number; deliveryRadius?: number }
  | { ok: false; message: string };

export function validateStoreGeoPayload(input: {
  latitudeText: string;
  longitudeText: string;
  radiusText: string;
  requiresDeliveryArea: boolean;
}): GeoValidationResult {
  const lat = parseCoordinateInput(input.latitudeText);
  const lon = parseCoordinateInput(input.longitudeText);
  const radiusRaw = parseCoordinateInput(input.radiusText);
  const hasAnyCoord = input.latitudeText.trim().length > 0 || input.longitudeText.trim().length > 0;

  if (!input.requiresDeliveryArea && !hasAnyCoord) {
    return { ok: true };
  }

  if (lat == null || lon == null) {
    return {
      ok: false,
      message: 'Set your shop location (use GPS or enter latitude and longitude).',
    };
  }
  if (!isValidLatitude(lat)) {
    return { ok: false, message: 'Latitude must be between -90 and 90.' };
  }
  if (!isValidLongitude(lon)) {
    return { ok: false, message: 'Longitude must be between -180 and 180.' };
  }

  const deliveryRadius =
    radiusRaw == null ? 3 : clampDeliveryRadiusKm(radiusRaw);

  if (input.requiresDeliveryArea && !isValidDeliveryRadiusKm(deliveryRadius)) {
    return {
      ok: false,
      message: `Delivery radius must be between ${RADIUS_MIN_KM} and ${RADIUS_MAX_KM} km.`,
    };
  }

  return { ok: true, latitude: lat, longitude: lon, deliveryRadius };
}
