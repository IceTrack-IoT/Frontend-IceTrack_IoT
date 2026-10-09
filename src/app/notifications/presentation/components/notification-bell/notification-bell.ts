import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { createNotificationsMock } from '@notifications/presentation/mocks/notifications.mock';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Link to the notification center with the unread count, rendered in the header of the owner shell.
 */
@Component({
  imports: [RouterLink, RouterLinkActive, TranslatePipe, Icon],
  selector: 'app-notification-bell',
  styleUrl: './notification-bell.css',
  templateUrl: './notification-bell.html',
})
export class NotificationBell {
  /**
   * The number of unread notifications.
   * TODO: Read the unread count from the NotificationsStore; the mocked count does not follow the actions
   * taken in the notification center.
   */
  protected readonly unreadCount = createNotificationsMock().filter(
    (notification) => !notification.is_read && notification.dismissed_at === null,
  ).length;
}
