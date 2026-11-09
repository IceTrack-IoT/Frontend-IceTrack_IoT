import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, type Observable, of, switchMap } from 'rxjs';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import type { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import type { EquipmentDirectory } from '@monitoring/application/contracts/monitored-equipment';
import type { MonitoringOverview } from '@monitoring/application/contracts/monitoring-overview';
import { ActiveServiceRequestCountPort } from '@monitoring/application/ports/active-service-request-count.port';
import { AlertPolicyPort } from '@monitoring/application/ports/alert-policy.port';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';
import { EquipmentDirectoryPort } from '@monitoring/application/ports/equipment-directory.port';

/** The active alerts of one equipment item and its policy, or null when the policy cannot be read. */
interface EquipmentMonitoring {
  readonly equipmentId: number;
  readonly alerts: Alert[];
  readonly policy: AlertPolicy | null;
}

/**
 * Loads the owner's monitoring overview. The backend has no aggregated metrics endpoint, so the overview
 * is composed from the list endpoints: the owner's equipment (from Assets Management), the active alerts
 * and the applicable policy of each item, and the count of active service requests (from Service Request
 * Management). A policy or a service request count that cannot be read is left out instead of failing the
 * whole overview.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadMonitoringOverviewUseCase {
  private readonly equipmentDirectory = inject(EquipmentDirectoryPort);
  private readonly alerts = inject(AlertsPort);
  private readonly alertPolicies = inject(AlertPolicyPort);
  private readonly serviceRequestCount = inject(ActiveServiceRequestCountPort);

  /**
   * @returns An Observable of the overview.
   */
  execute(): Observable<MonitoringOverview> {
    return forkJoin({
      directory: this.equipmentDirectory.listEquipment(),
      activeServiceRequests: this.serviceRequestCount
        .countActiveServiceRequests()
        .pipe(catchError(() => of<number | null>(null))),
    }).pipe(
      switchMap(({ directory, activeServiceRequests }) =>
        this.monitoringOf(directory).pipe(
          map((monitoring) => ({
            equipment: directory.equipment,
            siteCount: directory.siteCount,
            policies: new Map(
              monitoring.flatMap(({ equipmentId, policy }) =>
                policy === null ? [] : [[equipmentId, policy] as const],
              ),
            ),
            activeAlerts: monitoring
              .flatMap(({ alerts }) => alerts)
              .sort((first, second) => second.opened_at.getTime() - first.opened_at.getTime()),
            activeServiceRequests,
          })),
        ),
      ),
    );
  }

  private monitoringOf(directory: EquipmentDirectory): Observable<EquipmentMonitoring[]> {
    if (directory.equipment.length === 0) {
      return of([]);
    }
    return forkJoin(
      directory.equipment.map(({ id }) =>
        forkJoin({
          alerts: this.alerts.listActiveAlerts(id),
          policy: this.alertPolicies
            .getApplicablePolicy(id)
            .pipe(catchError(() => of<AlertPolicy | null>(null))),
        }).pipe(map(({ alerts, policy }) => ({ equipmentId: id, alerts, policy }))),
      ),
    );
  }
}
