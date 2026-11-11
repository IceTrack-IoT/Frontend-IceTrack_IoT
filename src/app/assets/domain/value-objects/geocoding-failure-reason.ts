/**
 * GeocodingFailureReason tells why a site could not be located (`geocoding_status` FAILED or NOT_FOUND).
 * `UNKNOWN` is reported for a site that failed before the reasons were recorded.
 */
export enum GeocodingFailureReason {
  ADDRESS_NOT_FOUND = 'ADDRESS_NOT_FOUND',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  OUT_OF_COVERAGE = 'OUT_OF_COVERAGE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Checks whether a value is one of the confirmed geocoding failure reasons.
 * @param value - The value to check.
 * @returns True when the value is a GeocodingFailureReason.
 */
export function isGeocodingFailureReason(value: unknown): value is GeocodingFailureReason {
  return Object.values(GeocodingFailureReason).some((reason) => reason === value);
}
