import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import {
  type AlertDismissal,
  DISMISS_EVIDENCE_MAX_LENGTH,
  DISMISS_REASON_MAX_LENGTH,
} from '@monitoring/application/contracts/alert-dismissal';
import { MonitoringError } from '@monitoring/application/contracts/monitoring-error';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';

/**
 * Dismisses an active alert of the owner as a false alarm, with a mandatory reason and optional evidence.
 * The backend records who dismissed it, when and why, and leaves it out of thermal excursion reports.
 */
@Injectable({
  providedIn: 'root',
})
export class DismissAlertUseCase {
  private readonly alerts = inject(AlertsPort);

  /**
   * @param alert - The alert to dismiss.
   * @param dismissal - The reason and optional evidence.
   * @returns An Observable of the dismissed alert, as the backend recorded it.
   */
  execute(alert: Alert, dismissal: AlertDismissal): Observable<Alert> {
    if (!alert.canBeClosed()) {
      return throwError(
        () =>
          new MonitoringError(
            'INVALID_STATUS_TRANSITION',
            'Only an active alert can be dismissed.',
          ),
      );
    }
    const reason = dismissal.reason.trim();
    const evidence = dismissal.evidence?.trim() || null;
    if (
      reason === '' ||
      reason.length > DISMISS_REASON_MAX_LENGTH ||
      (evidence !== null && evidence.length > DISMISS_EVIDENCE_MAX_LENGTH)
    ) {
      return throwError(
        () =>
          new MonitoringError('VALIDATION_ERROR', 'The dismissal reason or evidence is invalid.'),
      );
    }
    return this.alerts.dismissAlert(alert.id, { reason, evidence });
  }
}
