import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Notification } from '@notifications/domain/model/notification.entity';
import { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';
import { NotificationsStore } from '@notifications/application/notifications-store';
import {
  NOTIFICATION_ACTION_SUCCESS_KEYS,
  NOTIFICATION_SEVERITY_APPEARANCE,
  NOTIFICATION_TYPE_ICONS,
  notificationActionErrorKey,
} from '@notifications/presentation/notification-appearance';
import {
  type LocalizedNotificationMessage,
  localizedNotificationMessage,
} from '@notifications/presentation/notification-message';
import { Icon } from '@shared/presentation/components/icon/icon';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { activeLanguage } from '@shared/presentation/pipes/active-language';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/**
 * Notification center of the owner: lists the active notifications page by page, most recent first, with
 * their type, severity and read state, and lets the owner mark them as read or dismiss them. Dismissing
 * removes a notification from the active inbox without deleting it. The inbox can be narrowed to unread
 * notifications and to a severity and a type, and every unread notification matching the severity and
 * type can be marked as read at once. New notifications arrive live.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Icon,
    Pagination,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
  ],
  selector: 'app-notification-center',
  styleUrl: './notification-center.css',
  templateUrl: './notification-center.html',
})
export class NotificationCenter {
  protected readonly store = inject(NotificationsStore);
  private readonly translate = inject(TranslateService);
  private readonly numberFormats = new Map<string, Intl.NumberFormat>();

  /**
   * The message of a notification in the interface language, from its template, or null to show the
   * English text the backend composed. Read on every render, so it follows a change of language.
   * @param notification - The notification.
   * @returns The translation key and its values, or null.
   */
  protected localizedMessage(notification: Notification): LocalizedNotificationMessage | null {
    return localizedNotificationMessage(notification, (value, fractionDigits) => {
      const key = `${activeLanguage(this.translate)}|${fractionDigits}`;
      let format = this.numberFormats.get(key);
      if (format === undefined) {
        format = new Intl.NumberFormat(activeLanguage(this.translate), {
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        });
        this.numberFormats.set(key, format);
      }
      return format.format(value);
    });
  }
  protected readonly severityAppearance = NOTIFICATION_SEVERITY_APPEARANCE;
  protected readonly typeIcons = NOTIFICATION_TYPE_ICONS;
  protected readonly serviceRequestUpdate = NotificationType.SERVICE_REQUEST_UPDATE;
  protected readonly severities = Object.values(NotificationSeverity);
  protected readonly types = Object.values(NotificationType);

  protected readonly filterForm = inject(NonNullableFormBuilder).group({
    severity: ['ALL' as NotificationSeverity | 'ALL'],
    type: ['ALL' as NotificationType | 'ALL'],
  });
  /** Whether a severity or type narrows the inbox. */
  protected readonly filtered = computed(() => {
    const { severities, types } = this.store.filters();
    return severities.length > 0 || types.length > 0;
  });

  /** The current 1-based page, for the pagination. */
  protected readonly pageNumber = computed(() => (this.store.page()?.page ?? 0) + 1);
  protected readonly pageCount = computed(() => this.store.page()?.totalPages ?? 1);

  /** Whether every selectable notification of the page is selected. */
  protected readonly allSelected = computed(() => {
    const selectable = this.store.selectableNotifications().length;
    return selectable > 0 && this.store.selectedIds().size === selectable;
  });
  /** Whether some, but not all, selectable notifications of the page are selected. */
  protected readonly someSelected = computed(
    () => this.store.selectedIds().size > 0 && !this.allSelected(),
  );

  /** The confirmation of the last successful action, announced to assistive technologies. */
  protected readonly announcement = computed(() => {
    if (this.store.markAllState()?.status === 'succeeded') {
      return 'notifications.center.markedAllAsRead';
    }
    if (this.store.markSelectedState()?.status === 'succeeded') {
      return 'notifications.center.markedSelectedAsRead';
    }
    const state = this.store.actionState();
    return state?.status === 'succeeded' ? NOTIFICATION_ACTION_SUCCESS_KEYS[state.action] : null;
  });
  /** How many notifications the last "mark all" or "mark selected" as read changed. */
  protected readonly markedCount = computed(
    () =>
      this.store.markAllState()?.updatedCount ?? this.store.markSelectedState()?.updatedCount ?? 0,
  );
  /** Why the last action failed. */
  protected readonly actionErrorKey = computed(() => {
    const markAll = this.store.markAllState();
    if (markAll?.status === 'failed') {
      return notificationActionErrorKey(markAll.failure);
    }
    const markSelected = this.store.markSelectedState();
    if (markSelected?.status === 'failed') {
      return notificationActionErrorKey(markSelected.failure);
    }
    const state = this.store.actionState();
    return state?.status === 'failed' ? notificationActionErrorKey(state.failure) : null;
  });

  constructor() {
    this.store.attachInbox(inject(DestroyRef));
    this.store.openInbox();
    this.store.refreshUnreadCount();
    this.filterForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const { severity, type } = this.filterForm.getRawValue();
      this.store.clearAction();
      this.store.setFilters({
        severities: severity === 'ALL' ? [] : [severity],
        types: type === 'ALL' ? [] : [type],
      });
    });
  }

  protected markAllAsRead(): void {
    this.store.clearAction();
    this.store.markAllAsRead();
  }

  protected markSelectedAsRead(): void {
    this.store.clearAction();
    this.store.markSelectedAsRead();
  }

  protected toggleSelected(notification: Notification, event: Event): void {
    this.store.setSelected(notification.id, isChecked(event));
  }

  protected toggleAllSelected(event: Event): void {
    this.store.setAllSelected(isChecked(event));
  }

  protected clearFilters(): void {
    this.filterForm.reset();
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

/** Reads whether the checkbox that raised a change event is checked. */
function isChecked(event: Event): boolean {
  return event.target instanceof HTMLInputElement && event.target.checked;
}
