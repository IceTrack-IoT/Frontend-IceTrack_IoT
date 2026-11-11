/**
 * DashboardConfigResponse is returned by every dashboard configuration endpoint. `cards` holds one card
 * per card type, sorted by their order.
 */
export interface DashboardConfigResponse {
  id: number;
  user_id: number;
  default_site_id: number;
  default_temperature_range: TemperatureRangeResource;
  cards: DashboardCardResource[];
  /** Concurrency version, sent back in `If-Match` on the layout and defaults updates. */
  version: number;
}

/**
 * The temperature range a dashboard opens on: whole-number bounds (`min` never above `max`), a unit
 * (`C` or `F`) and a non-blank label.
 */
export interface TemperatureRangeResource {
  min: number;
  max: number;
  unit: string;
  label: string;
}

/**
 * A card of a dashboard: its identifier, type, 1-based position and visibility.
 */
export interface DashboardCardResource {
  card_id: number;
  card_type: string;
  order: number;
  is_visible: boolean;
}
