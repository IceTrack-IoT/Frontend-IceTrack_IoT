import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { Notification } from '@notifications/domain/model/notification.entity';
import { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';
import {
  ALERT_NOTIFICATION_TYPES,
  NOTIFICATION_SEVERITY_APPEARANCE,
  NOTIFICATION_TYPE_ICONS,
} from '@notifications/presentation/notification-appearance';
import {
  createNotificationsMock,
  NOTIFICATION_EQUIPMENT_NAMES,
} from '@notifications/presentation/mocks/notifications.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import {
  pageCountOf,
  pageOf,
  Pagination,
} from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

const PAGE_SIZE = 6;

type ReadFilter = 'all' | 'unread';

/**
 * Notification center of the owner: lists the active notifications with their type, severity and read
 * state, and lets the owner mark them as read or dismiss them. Dismissing removes a notification from the
 * active list without deleting it.
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
  protected readonly source = injectMockDataSource();
  protected readonly severities = Object.values(NotificationSeverity);
  protected readonly types = Object.values(NotificationType);
  protected readonly severityAppearance = NOTIFICATION_SEVERITY_APPEARANCE;
  protected readonly typeIcons = NOTIFICATION_TYPE_ICONS;
  protected readonly equipmentNames = NOTIFICATION_EQUIPMENT_NAMES;
  protected readonly serviceRequestUpdate = NotificationType.SERVICE_REQUEST_UPDATE;

  protected readonly filters = inject(NonNullableFormBuilder).group({
    severity: ['ALL' as NotificationSeverity | 'ALL'],
    type: ['ALL' as NotificationType | 'ALL'],
  });
  private readonly filterValue = toSignal(
    this.filters.valueChanges.pipe(map(() => this.filters.getRawValue())),
    { initialValue: this.filters.getRawValue() },
  );

  private readonly notifications = signal<Notification[]>([]);
  protected readonly readFilter = signal<ReadFilter>('all');
  protected readonly page = signal(1);
  /** The translation key of the outcome of the last action, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  protected readonly active = computed(() =>
    this.notifications().filter((notification) => notification.dismissed_at === null),
  );
  protected readonly unreadCount = computed(
    () => this.active().filter((notification) => !notification.is_read).length,
  );
  protected readonly filtered = computed(() => {
    const { severity, type } = this.filterValue();
    const unreadOnly = this.readFilter() === 'unread';
    return this.active().filter(
      (notification) =>
        (!unreadOnly || !notification.is_read) &&
        (severity === 'ALL' || notification.severity === severity) &&
        (type === 'ALL' || notification.type === type),
    );
  });
  protected readonly pageCount = computed(() => pageCountOf(this.filtered().length, PAGE_SIZE));
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  constructor() {
    this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.page.set(1));
    this.load();
  }

  protected load(): void {
    this.source.load((empty) => this.notifications.set(empty ? [] : createNotificationsMock()));
  }

  protected setReadFilter(filter: ReadFilter): void {
    this.readFilter.set(filter);
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.filters.reset();
    this.setReadFilter('all');
  }

  protected linksToAlert(notification: Notification): boolean {
    return ALERT_NOTIFICATION_TYPES.has(notification.type);
  }

  protected markAsRead(notification: Notification): void {
    // TODO: Delegate to the NotificationsStore; the change is local to this view.
    notification.is_read = true;
    notification.read_at = new Date();
    this.notifications.update((notifications) => [...notifications]);
    this.announcement.set('notifications.center.markedAsRead');
  }

  protected markAllAsRead(): void {
    const readAt = new Date();
    for (const notification of this.active()) {
      if (!notification.is_read) {
        notification.is_read = true;
        notification.read_at = readAt;
      }
    }
    this.notifications.update((notifications) => [...notifications]);
    this.announcement.set('notifications.center.allMarkedAsRead');
  }

  protected dismiss(notification: Notification): void {
    // TODO: Delegate to the NotificationsStore; the change is local to this view.
    notification.dismissed_at = new Date();
    this.notifications.update((notifications) => [...notifications]);
    this.page.update((page) => Math.min(page, this.pageCount()));
    this.announcement.set('notifications.center.dismissed');
  }
}
