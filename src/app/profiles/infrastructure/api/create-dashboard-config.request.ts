import { TemperatureRangeResource } from '@profiles/infrastructure/api/dashboard-config.response';

/**
 * Represents the request payload for creating a new dashboard configuration for a user.
 */
export interface CreateDashboardConfigRequest {
  user_id: number;
  default_site_id: number;
  default_temperature_range: TemperatureRangeResource;
}

