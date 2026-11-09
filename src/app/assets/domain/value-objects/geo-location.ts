/**
 * Represents the resolved coordinates of a site, in degrees.
 */
export interface GeoLocation {
  readonly latitude: number;
  readonly longitude: number;
  /** The map provider's place identifier, or null when it supplied none. */
  readonly place_id: string | null;
}
