import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import type { MonitoringOverview } from '@monitoring/application/contracts/monitoring-overview';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';
import { DashboardSummaryPort } from '@monitoring/application/ports/dashboard-summary.port';
import { EquipmentDirectoryPort } from '@monitoring/application/ports/equipment-directory.port';

/** The most recently opened active alerts read with the overview. */
export const OVERVIEW_ACTIVE_ALERTS = 100;

/**
 * Loads the owner's monitoring overview in three parallel reads: the totals computed by the backend, the
 * owner's equipment with its telemetry and connectivity (from Assets Management), and the most recently
 * opened active alerts.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadMonitoringOverviewUseCase {
  private readonly summary = inject(DashboardSummaryPort);
  private readonly equipmentDirectory = inject(EquipmentDirectoryPort);
  private readonly alerts = inject(AlertsPort);

  /**
   * @returns An Observable of the overview.
   */
  execute(): Observable<MonitoringOverview> {
    return forkJoin({
      summary: this.summary.getSummary(),
      equipment: this.equipmentDirectory.listEquipment(),
      activeAlerts: this.alerts
        .listAlerts({
          statuses: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED],
          severities: [],
          types: [],
          equipmentId: null,
          page: 0,
          size: OVERVIEW_ACTIVE_ALERTS,
        })
        .pipe(map((page) => page.items)),
    });
  }
}
