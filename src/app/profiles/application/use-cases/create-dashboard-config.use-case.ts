import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { DashboardDefaults } from '@profiles/application/contracts/dashboard-config-change';
import { DashboardConfigPort } from '@profiles/application/ports/dashboard-config.port';
import type { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';

/**
 * Creates the dashboard configuration of the signed-in account in the default layout, opening on the
 * chosen site and temperature range.
 */
@Injectable({
  providedIn: 'root',
})
export class CreateDashboardConfigUseCase {
  private readonly dashboardConfigs = inject(DashboardConfigPort);

  /**
   * @param userId - The identifier of the signed-in platform account.
   * @param defaults - The site and temperature range the dashboard opens on.
   * @returns An Observable of the created configuration, with its cards.
   */
  execute(userId: number, defaults: DashboardDefaults): Observable<DashboardConfig> {
    return this.dashboardConfigs.createDashboardConfig(userId, defaults);
  }
}
