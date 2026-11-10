import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { NotificationsStore } from '@notifications/application/notifications-store';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Link to the notification center with the unread count, rendered in the header of the owner shell. The
 * count is read when the shell opens and then kept current by the live notification feed; while the feed
 * is unavailable it is read again after every navigation.
 */
@Component({
  imports: [RouterLink, RouterLinkActive, TranslatePipe, Icon],
  selector: 'app-notification-bell',
  styleUrl: './notification-bell.css',
  templateUrl: './notification-bell.html',
})
export class NotificationBell {
  private readonly store = inject(NotificationsStore);

  /** The number of unread notifications; 0 while it is unknown. */
  protected readonly unreadCount = computed(() => this.store.unreadCount() ?? 0);

  constructor() {
    this.store.attachBadge(inject(DestroyRef));
    this.store.refreshUnreadCount();
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (!this.store.live()) {
          this.store.refreshUnreadCount();
        }
      });
  }
}
