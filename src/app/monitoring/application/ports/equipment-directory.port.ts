import type { Observable } from 'rxjs';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';

/**
 * EquipmentDirectoryPort gives Monitoring and Alerting the read-only equipment data it needs to present
 * telemetry and alerts: identity, name, site, status, threshold, last known telemetry and connectivity.
 * Assets Management owns that data and implements this port with an application facade; it exposes no
 * equipment registration, editing, threshold configuration or ownership behavior.
 *
 * A missing or unreachable equipment item is reported as a MonitoringError with `NOT_FOUND`. Declared as an
 * abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class EquipmentDirectoryPort {
  /**
   * Lists every equipment item of the signed-in owner.
   * @returns An Observable of the equipment.
   */
  abstract listEquipment(): Observable<MonitoredEquipment[]>;

  /**
   * Retrieves one equipment item of the signed-in owner.
   * @param equipmentId - The identifier of the equipment.
   * @returns An Observable of the equipment.
   */
  abstract getEquipment(equipmentId: number): Observable<MonitoredEquipment>;
}
