import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { DashboardConfigPort } from '@profiles/application/ports/dashboard-config.port';
import type { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';

/**
 * Loads the dashboard configuration of the signed-in account.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadDashboardConfigUseCase {
  private readonly dashboardConfigs = inject(DashboardConfigPort);

  /**
   * @param userId - The identifier of the signed-in platform account.
   * @returns An Observable of the configuration; fails with `DASHBOARD_CONFIG_NOT_FOUND` when the account
   *  has none yet.
   */
  execute(userId: number): Observable<DashboardConfig> {
    return this.dashboardConfigs.getDashboardConfig(userId);
  }
}
