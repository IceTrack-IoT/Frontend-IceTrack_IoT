import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, of, switchMap } from 'rxjs';
import type { AlertWithEquipment } from '@monitoring/application/contracts/monitoring-overview';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';
import { EquipmentDirectoryPort } from '@monitoring/application/ports/equipment-directory.port';

/**
 * Loads one alert of the owner, whatever its status, together with the equipment it concerns. The alert
 * is shown even when its equipment can no longer be read.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadAlertDetailUseCase {
  private readonly alerts = inject(AlertsPort);
  private readonly equipmentDirectory = inject(EquipmentDirectoryPort);

  /**
   * @param alertId - The identifier of the alert.
   * @returns An Observable of the alert and its equipment.
   */
  execute(alertId: number): Observable<AlertWithEquipment> {
    return this.alerts.getAlert(alertId).pipe(
      switchMap((alert) =>
        this.equipmentDirectory.getEquipment(alert.equipment_id).pipe(
          catchError(() => of<MonitoredEquipment | null>(null)),
          map((equipment) => ({ alert, equipment })),
        ),
      ),
    );
  }
}
