import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import { MonitoringError } from '@monitoring/application/contracts/monitoring-error';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';

/**
 * Acknowledges an OPEN alert of the owner: the owner has seen it without yet resolving its condition. The
 * backend records who acknowledged it and when.
 */
@Injectable({
  providedIn: 'root',
})
export class AcknowledgeAlertUseCase {
  private readonly alerts = inject(AlertsPort);

  /**
   * @param alert - The alert to acknowledge.
   * @returns An Observable of the acknowledged alert, as the backend recorded it.
   */
  execute(alert: Alert): Observable<Alert> {
    if (!alert.canBeAcknowledged()) {
      return throwError(
        () =>
          new MonitoringError(
            'INVALID_STATUS_TRANSITION',
            'Only an OPEN alert can be acknowledged.',
          ),
      );
    }
    return this.alerts.acknowledgeAlert(alert.id);
  }
}
