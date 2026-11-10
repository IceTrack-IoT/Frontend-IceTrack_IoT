import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AlertPage, AlertQuery } from '@monitoring/application/contracts/alert-page';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';

/**
 * Loads one page of the owner's alerts, current and past, filtered by status, severity, type and
 * equipment.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadAlertPageUseCase {
  private readonly alerts = inject(AlertsPort);

  /**
   * @param query - The filters and paging.
   * @returns An Observable of the page.
   */
  execute(query: AlertQuery): Observable<AlertPage> {
    return this.alerts.listAlerts(query);
  }
}
