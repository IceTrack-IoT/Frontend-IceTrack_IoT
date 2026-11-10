import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Alert } from '@monitoring/domain/model/alert.entity';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';

/**
 * Reads one alert of the owner as the backend currently records it, to reconcile local state after a live
 * status change or a rejected action.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadAlertUseCase {
  private readonly alerts = inject(AlertsPort);

  /**
   * @param alertId - The identifier of the alert.
   * @returns An Observable of the alert.
   */
  execute(alertId: number): Observable<Alert> {
    return this.alerts.getAlert(alertId);
  }
}
