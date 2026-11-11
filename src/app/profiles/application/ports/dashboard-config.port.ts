import type { Observable } from 'rxjs';
import type { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';
import type { DashboardCard } from '@profiles/domain/value-objects/dashboard-card';
import type { DashboardDefaults } from '@profiles/application/contracts/dashboard-config-change';

/**
 * DashboardConfigPort is the outbound port used by Profiles use cases to read and change the dashboard
 * configuration of the caller's own account.
 *
 * Definitive backend rejections (any 4xx answer) are reported as ProfilesError; any other error is
 * transient. Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class DashboardConfigPort {
  /**
   * Retrieves the dashboard configuration of an account.
   * Fails with ProfilesError code `DASHBOARD_CONFIG_NOT_FOUND` when the account has none yet.
   * @param userId - The identifier of the caller's own platform account.
   */
  abstract getDashboardConfig(userId: number): Observable<DashboardConfig>;

  /**
   * Creates the dashboard configuration of an account in the default layout.
   * Fails with ProfilesError code `VALIDATION_ERROR` or `DASHBOARD_CONFIG_CONFLICT` (it already exists).
   * @param userId - The identifier of the caller's own platform account.
   * @param defaults - The site and temperature range the dashboard opens on.
   */
  abstract createDashboardConfig(
    userId: number,
    defaults: DashboardDefaults,
  ): Observable<DashboardConfig>;

  /**
   * Replaces the position and visibility of every card, only when the configuration is still at the given
   * version. The layout must place each card exactly once, at the positions 1 to N. Fails with
   * ProfilesError code `VALIDATION_ERROR`, `DASHBOARD_CONFIG_NOT_FOUND` or
   * `CONCURRENT_MODIFICATION_CONFLICT` (the configuration changed since that version; nothing is changed).
   * @param userId - The identifier of the caller's own platform account.
   * @param version - The version of the configuration the change was made from.
   * @param layout - Every card with its position and visibility.
   */
  abstract updateDashboardLayout(
    userId: number,
    version: number,
    layout: readonly DashboardCard[],
  ): Observable<DashboardConfig>;

  /**
   * Replaces the site and temperature range the dashboard opens on, only when the configuration is still
   * at the given version. Fails with ProfilesError code `VALIDATION_ERROR`, `DASHBOARD_CONFIG_NOT_FOUND`
   * or `CONCURRENT_MODIFICATION_CONFLICT`.
   * @param userId - The identifier of the caller's own platform account.
   * @param version - The version of the configuration the change was made from.
   * @param defaults - The new defaults.
   */
  abstract updateDashboardDefaults(
    userId: number,
    version: number,
    defaults: DashboardDefaults,
  ): Observable<DashboardConfig>;
}
