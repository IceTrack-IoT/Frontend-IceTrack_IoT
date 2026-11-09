/**
 * GeocodingStatus enum represents where a site stands in locating its address.
 */
export enum GeocodingStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  FAILED = 'FAILED',
  NOT_FOUND = 'NOT_FOUND',
}

/**
 * Checks whether a value is one of the confirmed values of geocoding status.
 * @param value - The value to check.
 * @returns True when the value is a GeocodingStatus.
 */
export function isGeocodingStatus(value: unknown): value is GeocodingStatus {
  return Object.values(GeocodingStatus).some((geocodingStatus) => geocodingStatus === value);
}
