import type { TemperatureRangeResource } from '@profiles/infrastructure/api/dashboard-config.response';

/**
 * UpdateDashboardDefaultsRequest is the request body of
 * `PUT /profiles/dashboard-configs/user/{userId}/defaults`.
 */
export interface UpdateDashboardDefaultsRequest {
  /** A site id greater than 0. */
  default_site_id: number;
  default_temperature_range: TemperatureRangeResource;
}
