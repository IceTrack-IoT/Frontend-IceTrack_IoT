import type { Observable } from 'rxjs';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import type { AlertPage, AlertQuery } from '@monitoring/application/contracts/alert-page';
import type { AlertDismissal } from '@monitoring/application/contracts/alert-dismissal';

/**
 * AlertsPort is the outbound port used by Monitoring and Alerting use cases to read the owner's alerts and
 * run their lifecycle actions on the backend. Every action answers the alert as the backend recorded it.
 *
 * Definitive backend rejections are reported as MonitoringError; any other error is transient. Declared as
 * an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class AlertsPort {
  /**
   * Retrieves one alert of the owner, whatever its status.
   * Fails with `NOT_FOUND` when it does not exist or is not reachable by the owner.
   * @param alertId - The identifier of the alert.
   * @returns An Observable of the alert.
   */
  abstract getAlert(alertId: number): Observable<Alert>;

  /**
   * Lists one page of the owner's alerts, whatever their status, most recently opened first.
   * Fails with `VALIDATION_ERROR` for an invalid filter or page, or `NOT_FOUND` when the equipment of the
   * filter is not reachable by the owner.
   * @param query - The filters and paging.
   * @returns An Observable of the page.
   */
  abstract listAlerts(query: AlertQuery): Observable<AlertPage>;

  /**
   * Lists the OPEN and ACKNOWLEDGED alerts of an equipment item; empty for a unit the owner may not read.
   * @param equipmentId - The identifier of the equipment.
   * @returns An Observable of the active alerts.
   */
  abstract listActiveAlerts(equipmentId: number): Observable<Alert[]>;

  /**
   * Acknowledges an OPEN alert.
   * Fails with `NOT_FOUND` or `INVALID_STATUS_TRANSITION` (the alert is not OPEN).
   * @param alertId - The identifier of the alert.
   * @returns An Observable of the acknowledged alert.
   */
  abstract acknowledgeAlert(alertId: number): Observable<Alert>;

  /**
   * Resolves an OPEN or ACKNOWLEDGED alert once its condition has been corrected.
   * Fails with `NOT_FOUND` or `INVALID_STATUS_TRANSITION` (already resolved or dismissed).
   * @param alertId - The identifier of the alert.
   * @returns An Observable of the resolved alert.
   */
  abstract resolveAlert(alertId: number): Observable<Alert>;

  /**
   * Dismisses an OPEN or ACKNOWLEDGED alert as a false alarm.
   * Fails with `VALIDATION_ERROR`, `NOT_FOUND` or `INVALID_STATUS_TRANSITION`.
   * @param alertId - The identifier of the alert.
   * @param dismissal - The reason and optional evidence.
   * @returns An Observable of the dismissed alert.
   */
  abstract dismissAlert(alertId: number, dismissal: AlertDismissal): Observable<Alert>;
}
