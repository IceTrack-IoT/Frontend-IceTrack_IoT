import type { TemperatureRangeResource } from '@profiles/infrastructure/api/dashboard-config.response';

/**
 * CreateDashboardConfigRequest is the request body of `POST /profiles/dashboard-configs`. The backend
 * creates the cards in the default layout.
 */
export interface CreateDashboardConfigRequest {
  /** The caller's own platform account id. */
  user_id: number;
  /** An existing site id, greater than 0. */
  default_site_id: number;
  default_temperature_range: TemperatureRangeResource;
}
