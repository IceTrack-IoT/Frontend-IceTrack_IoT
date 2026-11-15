import { inject, Injectable } from '@angular/core';
import { concat, defer, type Observable, of, tap } from 'rxjs';
import type { DashboardConfigChange } from '@profiles/application/contracts/dashboard-config-change';
import { DashboardConfigPort } from '@profiles/application/ports/dashboard-config.port';
import type { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';

/**
 * Saves the layout and defaults the owner chose for an existing dashboard. The backend changes them
 * through separate requests, so only the parts that differ from the current configuration are sent: the
 * layout first, then the defaults. Each request names the version it was made from, so a configuration
 * changed meanwhile (another tab or session) is refused instead of overwritten.
 */
@Injectable({
  providedIn: 'root',
})
export class SaveDashboardConfigUseCase {
  private readonly dashboardConfigs = inject(DashboardConfigPort);

  /**
   * @param config - The current dashboard configuration.
   * @param change - The chosen layout and defaults.
   * @returns An Observable emitting the stored configuration after each request, so a change that is
   *  only partly saved is still reflected; it emits the current configuration once when nothing changed.
   */
  execute(config: DashboardConfig, change: DashboardConfigChange): Observable<DashboardConfig> {
    const layoutChanged = !config.hasLayout(change.cards);
    const defaultsChanged = !config.hasDefaults(
      change.defaultSiteId,
      change.defaultTemperatureRange,
    );
    if (!layoutChanged && !defaultsChanged) {
      return of(config);
    }
    // Each request is made from the version the previous one stored, starting from the loaded one.
    let version = config.version;
    const requests: ((fromVersion: number) => Observable<DashboardConfig>)[] = [];
    if (layoutChanged) {
      requests.push((fromVersion) =>
        this.dashboardConfigs.updateDashboardLayout(config.user_id, fromVersion, change.cards),
      );
    }
    if (defaultsChanged) {
      requests.push((fromVersion) =>
        this.dashboardConfigs.updateDashboardDefaults(config.user_id, fromVersion, {
          defaultSiteId: change.defaultSiteId,
          defaultTemperatureRange: change.defaultTemperatureRange,
        }),
      );
    }
    return concat(
      ...requests.map((request) =>
        defer(() => request(version)).pipe(tap((stored) => (version = stored.version))),
      ),
    );
  }
}
