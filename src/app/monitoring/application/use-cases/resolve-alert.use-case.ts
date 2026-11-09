import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import { MonitoringError } from '@monitoring/application/contracts/monitoring-error';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';

/**
 * Resolves an active alert of the owner once its condition has been corrected. The backend records who
 * resolved it and when, and the total duration of the alert.
 */
@Injectable({
  providedIn: 'root',
})
export class ResolveAlertUseCase {
  private readonly alerts = inject(AlertsPort);

  /**
   * @param alert - The alert to resolve.
   * @returns An Observable of the resolved alert, as the backend recorded it.
   */
  execute(alert: Alert): Observable<Alert> {
    if (!alert.canBeClosed()) {
      return throwError(
        () =>
          new MonitoringError('INVALID_STATUS_TRANSITION', 'Only an active alert can be resolved.'),
      );
    }
    return this.alerts.resolveAlert(alert.id);
  }
}
