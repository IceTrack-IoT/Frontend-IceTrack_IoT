/**
 * This file contains the interface definitions for the dashboard configuration response from the API.
 */
export interface DashboardConfigResponse {
  id: number;
  user_id: number;
  default_site_id: number;
  default_temperature_range: TemperatureRangeResource;
  cards: DashboardCardResource[];
}

/**
 * Represents the temperature range configuration for a user's dashboard, including minimum and maximum values, unit of measurement, and a descriptive label.
 */
export interface TemperatureRangeResource {
  min: number;
  max: number;
  unit: string;
  label: string;
}

/**
 * Represents a card displayed on a user's dashboard, including its unique identifier, type, order of appearance, and visibility status.
 */
export interface DashboardCardResource {
  card_id: number;
  card_type: string;
  order: number;
  is_visible: boolean;
}
