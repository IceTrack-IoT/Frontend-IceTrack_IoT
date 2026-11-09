/**
 * SiteResource is returned by `GET /assets/sites` (a plain JSON array). Only the properties read by
 * this client are modeled.
 */
export interface SiteResource {
  id: number;
  owner_id: number;
  name: string;
}
