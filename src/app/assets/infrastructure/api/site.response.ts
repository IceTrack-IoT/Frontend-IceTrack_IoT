/**
 * GeoLocationResource is the resolved location embedded in a SiteResource.
 */
export interface GeoLocationResource {
  latitude: number;
  longitude: number;
  place_id?: string | null;
}

/**
 * SiteResource is returned by the site endpoints of `SiteController`. `location` and `navigation_url` are
 * omitted unless the site is located.
 */
export interface SiteResource {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  contact_name: string;
  phone: string;
  equipment_count: number;
  geocoding_status: string;
  location?: GeoLocationResource | null;
  navigation_url?: string | null;
}

/**
 * AddressValidationResource is returned by `POST /assets/sites/validate-address` when the address is
 * verified inside the service area.
 */
export interface AddressValidationResource {
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id?: string | null;
  district?: string | null;
  area: string;
  validation_token: string;
}
