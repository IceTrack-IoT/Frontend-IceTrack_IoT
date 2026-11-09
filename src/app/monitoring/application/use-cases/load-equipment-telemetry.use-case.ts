import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, type Observable, of } from 'rxjs';
import type { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import type { EquipmentTelemetryContext } from '@monitoring/application/contracts/monitoring-overview';
import { AlertPolicyPort } from '@monitoring/application/ports/alert-policy.port';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';
import { EquipmentDirectoryPort } from '@monitoring/application/ports/equipment-directory.port';

/**
 * Loads the telemetry context of one of the owner's equipment items: the item with its last known
 * telemetry (from Assets Management), its applicable alert policy and its active alerts. The policy is
 * left out when it cannot be read.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadEquipmentTelemetryUseCase {
  private readonly equipmentDirectory = inject(EquipmentDirectoryPort);
  private readonly alerts = inject(AlertsPort);
  private readonly alertPolicies = inject(AlertPolicyPort);

  /**
   * @param equipmentId - The identifier of the equipment.
   * @returns An Observable of the telemetry context.
   */
  execute(equipmentId: number): Observable<EquipmentTelemetryContext> {
    return forkJoin({
      equipment: this.equipmentDirectory.getEquipment(equipmentId),
      policy: this.alertPolicies
        .getApplicablePolicy(equipmentId)
        .pipe(catchError(() => of<AlertPolicy | null>(null))),
      activeAlerts: this.alerts.listActiveAlerts(equipmentId),
    });
  }
}
