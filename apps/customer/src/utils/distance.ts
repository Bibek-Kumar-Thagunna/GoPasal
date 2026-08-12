/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters
 */
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

/**
 * Checks if a given coordinate is within a specified radius of another coordinate.
 *
 * @param customerLat Customer's latitude
 * @param customerLon Customer's longitude
 * @param shopLat Shop's latitude
 * @param shopLon Shop's longitude
 * @param maxRadiusMeters Maximum allowed distance in meters
 * @returns boolean indicating if the distance is within the radius
 */
export function isWithinDeliveryRadius(
  customerLat: number,
  customerLon: number,
  shopLat: number,
  shopLon: number,
  maxRadiusMeters: number
): boolean {
  const distance = getDistanceInMeters(
    customerLat,
    customerLon,
    shopLat,
    shopLon
  );
  return distance <= maxRadiusMeters;
}
