import { Component, computed, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { Notification } from '@notifications/domain/model/notification.entity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';
import { NotificationsStore } from '@notifications/application/notifications-store';
import {
  NOTIFICATION_ACTION_SUCCESS_KEYS,
  NOTIFICATION_SEVERITY_APPEARANCE,
  NOTIFICATION_TYPE_ICONS,
  notificationActionErrorKey,
} from '@notifications/presentation/notification-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/**
 * Notification center of the owner: lists the active notifications page by page, most recent first, with
 * their type, severity and read state, and lets the owner mark them as read or dismiss them. Dismissing
 * removes a notification from the active inbox without deleting it. The inbox can be narrowed to unread
 * notifications, the only filter the backend offers.
 */
@Component({
  imports: [RouterLink, TranslatePipe, Icon, Pagination, StatePanel, StatusTag, LocalizedDatePipe],
  selector: 'app-notification-center',
  styleUrl: './notification-center.css',
  templateUrl: './notification-center.html',
})
export class NotificationCenter {
  protected readonly store = inject(NotificationsStore);
  protected readonly severityAppearance = NOTIFICATION_SEVERITY_APPEARANCE;
  protected readonly typeIcons = NOTIFICATION_TYPE_ICONS;
  protected readonly serviceRequestUpdate = NotificationType.SERVICE_REQUEST_UPDATE;

  /** The current 1-based page, for the pagination. */
  protected readonly pageNumber = computed(() => (this.store.page()?.page ?? 0) + 1);
  protected readonly pageCount = computed(() => this.store.page()?.totalPages ?? 1);

  /** The confirmation of the last successful action, announced to assistive technologies. */
  protected readonly announcement = computed(() => {
    const state = this.store.actionState();
    return state?.status === 'succeeded' ? NOTIFICATION_ACTION_SUCCESS_KEYS[state.action] : null;
  });
  /** Why the last action failed. */
  protected readonly actionErrorKey = computed(() => {
    const state = this.store.actionState();
    return state?.status === 'failed' ? notificationActionErrorKey(state.failure) : null;
  });

  constructor() {
    this.store.attachInbox(inject(DestroyRef));
    this.store.openInbox();
    this.store.refreshUnreadCount();
  }

  protected load(): void {
    this.store.loadPage();
  }

  protected setUnreadOnly(unreadOnly: boolean): void {
    this.store.clearAction();
    this.store.setUnreadOnly(unreadOnly);
  }

  protected goToPage(pageNumber: number): void {
    this.store.clearAction();
    this.store.loadPage(pageNumber - 1);
  }

  protected equipmentName(notification: Notification): string | null {
    return notification.equipment_id === null
      ? null
      : (this.store.equipmentNames().get(notification.equipment_id) ?? null);
  }

  protected markAsRead(notification: Notification): void {
    this.store.markAsRead(notification);
  }

  protected dismiss(notification: Notification): void {
    this.store.dismiss(notification);
  }
}
