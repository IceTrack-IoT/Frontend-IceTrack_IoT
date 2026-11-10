import type { DashboardCard } from '@profiles/domain/value-objects/dashboard-card';
import type { TemperatureRange } from '@profiles/domain/value-objects/temperature-range';

/**
 * DashboardDefaults are the site and the reference temperature range a dashboard opens on.
 */
export interface DashboardDefaults {
  /** The identifier of one of the owner's sites. */
  readonly defaultSiteId: number;
  readonly defaultTemperatureRange: TemperatureRange;
}

/**
 * DashboardConfigChange is the layout and defaults the owner chose for an existing dashboard.
 */
export interface DashboardConfigChange extends DashboardDefaults {
  /** Every card of the dashboard, each with its new 1-based position and visibility. */
  readonly cards: readonly DashboardCard[];
}
