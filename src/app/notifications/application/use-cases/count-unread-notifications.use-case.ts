import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { NotificationsPort } from '@notifications/application/ports/notifications.port';

/**
 * Counts the signed-in user's notifications that are neither read nor dismissed, for the unread badge.
 */
@Injectable({
  providedIn: 'root',
})
export class CountUnreadNotificationsUseCase {
  private readonly notifications = inject(NotificationsPort);

  /**
   * @returns An Observable of the count.
   */
  execute(): Observable<number> {
    return this.notifications.countUnread();
  }
}
