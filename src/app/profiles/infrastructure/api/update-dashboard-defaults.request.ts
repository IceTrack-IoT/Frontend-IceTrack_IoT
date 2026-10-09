import { TemperatureRangeResource } from '@profiles/infrastructure/api/dashboard-config.response';

/**
 * Represents the request payload for updating the default settings of a user's dashboard configuration.
 */
export interface UpdateDashboardDefaultsRequest {
  default_site_id: number;
  default_temperature_range: TemperatureRangeResource;
}
