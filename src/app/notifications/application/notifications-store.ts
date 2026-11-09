import { computed, type DestroyRef, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, type Observable, of, type Subscription } from 'rxjs';
import type { Notification } from '@notifications/domain/model/notification.entity';
import type { NotificationPage } from '@notifications/application/contracts/notification-page';
import {
  type NotificationsFailure,
  toNotificationsFailure,
} from '@notifications/application/contracts/notifications-error';
import { CountUnreadNotificationsUseCase } from '@notifications/application/use-cases/count-unread-notifications.use-case';
import { DismissNotificationUseCase } from '@notifications/application/use-cases/dismiss-notification.use-case';
import { LoadNotificationPageUseCase } from '@notifications/application/use-cases/load-notification-page.use-case';
import { LoadNotifiedEquipmentUseCase } from '@notifications/application/use-cases/load-notified-equipment.use-case';
import { MarkNotificationAsReadUseCase } from '@notifications/application/use-cases/mark-notification-as-read.use-case';

/** The number of notifications per page of the notification center. */
export const NOTIFICATION_PAGE_SIZE = 10;

/** The actions the user runs on a notification. */
export type NotificationAction = 'read' | 'dismiss';

/** The outcome of the last notification action, until it is cleared. */
export interface NotificationActionState {
  readonly notificationId: number;
  readonly action: NotificationAction;
  readonly status: 'pending' | 'succeeded' | 'failed';
  readonly failure: NotificationsFailure | null;
}

/**
 * Notifications Store manages the signed-in user's notifications: the unread count shown by the badge,
 * the current page of the active inbox with its read filter, the names of the equipment the notifications
 * concern, and the outcome of marking as read and dismissing.
 *
 * It holds signal-based state only and delegates every operation to Notifications use cases. Actions are
 * not applied optimistically: the notification is replaced by the one the backend answers, and the page
 * and the unread count are read again whenever an action changes what they hold. The inbox is discarded
 * when the notification center closes and the count when the badge closes, so nothing survives a session.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationsStore {
  private readonly loadNotificationPageUseCase = inject(LoadNotificationPageUseCase);
  private readonly countUnreadNotificationsUseCase = inject(CountUnreadNotificationsUseCase);
  private readonly markNotificationAsReadUseCase = inject(MarkNotificationAsReadUseCase);
  private readonly dismissNotificationUseCase = inject(DismissNotificationUseCase);
  private readonly loadNotifiedEquipmentUseCase = inject(LoadNotifiedEquipmentUseCase);

  // Unread badge.
  private readonly unreadCountSignal = signal<number | null>(null);
  /** The number of unread notifications, or null while it is unknown. */
  readonly unreadCount = this.unreadCountSignal.asReadonly();

  // Inbox.
  private readonly pageIndexSignal = signal(0);
  private readonly unreadOnlySignal = signal(false);
  private readonly pageSignal = signal<NotificationPage | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly failureSignal = signal<NotificationsFailure | null>(null);
  private readonly equipmentNamesSignal = signal<ReadonlyMap<number, string>>(new Map());
  /** Whether only unread notifications are listed. */
  readonly unreadOnly = this.unreadOnlySignal.asReadonly();
  /** The current page of the active inbox, or null until one is loaded. */
  readonly page = this.pageSignal.asReadonly();
  /** The notifications of the current page, most recent first. */
  readonly notifications = computed(() => this.pageSignal()?.items ?? []);
  readonly loading = this.loadingSignal.asReadonly();
  readonly failure = this.failureSignal.asReadonly();
  /** The names of the owner's equipment by id; empty when they could not be read. */
  readonly equipmentNames = this.equipmentNamesSignal.asReadonly();

  // Actions.
  private readonly actionSignal = signal<NotificationActionState | null>(null);
  readonly actionState = this.actionSignal.asReadonly();
  readonly actionPending = computed(() => this.actionSignal()?.status === 'pending');

  private countSubscription: Subscription | null = null;
  private pageSubscription: Subscription | null = null;
  private equipmentSubscription: Subscription | null = null;
  private actionSubscription: Subscription | null = null;

  /**
   * Keeps the unread count while the caller lives; it is discarded once the caller is destroyed.
   * @param destroyRef - The lifetime of the badge.
   */
  attachBadge(destroyRef: DestroyRef): void {
    destroyRef.onDestroy(() => {
      this.countSubscription?.unsubscribe();
      this.countSubscription = null;
      this.unreadCountSignal.set(null);
    });
  }

  /**
   * Keeps the inbox while the caller lives; it is discarded once the caller is destroyed.
   * @param destroyRef - The lifetime of the notification center.
   */
  attachInbox(destroyRef: DestroyRef): void {
    destroyRef.onDestroy(() => this.releaseInbox());
  }

  /**
   * Reads the unread count again, keeping the one in memory until the new one arrives. A count that cannot
   * be read leaves the last known one.
   */
  refreshUnreadCount(): void {
    this.countSubscription?.unsubscribe();
    this.countSubscription = this.countUnreadNotificationsUseCase
      .execute()
      .pipe(catchError(() => of(null)))
      .subscribe((count) => {
        if (count !== null) {
          this.unreadCountSignal.set(count);
        }
      });
  }

  /**
   * Opens the inbox on its first page and reads the equipment names. A failure to read the names only
   * leaves the notifications without them.
   */
  openInbox(): void {
    this.equipmentSubscription?.unsubscribe();
    this.equipmentSubscription = this.loadNotifiedEquipmentUseCase
      .execute()
      .pipe(catchError(() => of(new Map<number, string>())))
      .subscribe((names) => this.equipmentNamesSignal.set(names));
    this.loadPage(0);
  }

  /**
   * Loads a page of the inbox, keeping the one in memory until the new one arrives.
   * @param pageIndex - The zero-based page index; the current one when omitted.
   */
  loadPage(pageIndex: number = this.pageIndexSignal()): void {
    this.pageIndexSignal.set(Math.max(0, pageIndex));
    this.pageSubscription?.unsubscribe();
    this.loadingSignal.set(true);
    this.failureSignal.set(null);
    this.pageSubscription = this.loadNotificationPageUseCase
      .execute({
        page: this.pageIndexSignal(),
        size: NOTIFICATION_PAGE_SIZE,
        unreadOnly: this.unreadOnlySignal(),
      })
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (page) => {
          // A page emptied by dismissals moves back to the last page that still has notifications.
          if (page.items.length === 0 && page.page > 0 && page.page >= page.totalPages) {
            this.loadPage(page.totalPages - 1);
            return;
          }
          this.pageSignal.set(page);
        },
        error: (error: unknown) => this.failureSignal.set(toNotificationsFailure(error)),
      });
  }

  /**
   * Lists all active notifications or only the unread ones, from the first page.
   * @param unreadOnly - Whether to list only unread notifications.
   */
  setUnreadOnly(unreadOnly: boolean): void {
    if (this.unreadOnlySignal() !== unreadOnly) {
      this.unreadOnlySignal.set(unreadOnly);
      this.loadPage(0);
    }
  }

  /**
   * Marks a notification as read.
   * @param notification - The notification.
   */
  markAsRead(notification: Notification): void {
    this.runAction(
      notification,
      'read',
      this.markNotificationAsReadUseCase.execute(notification),
      (read) => {
        if (this.unreadOnlySignal()) {
          this.loadPage();
        } else {
          this.replaceNotification(read);
        }
      },
    );
  }

  /**
   * Dismisses a notification from the active inbox; the page is read again so it stays full.
   * @param notification - The notification.
   */
  dismiss(notification: Notification): void {
    this.runAction(
      notification,
      'dismiss',
      this.dismissNotificationUseCase.execute(notification),
      () => this.loadPage(),
    );
  }

  /** Forgets the outcome of the last action. */
  clearAction(): void {
    if (!this.actionPending()) {
      this.actionSignal.set(null);
    }
  }

  private runAction(
    notification: Notification,
    action: NotificationAction,
    run: Observable<Notification>,
    apply: (notification: Notification) => void,
  ): void {
    if (this.actionPending()) {
      return;
    }
    const notificationId = notification.id;
    this.actionSignal.set({ notificationId, action, status: 'pending', failure: null });
    this.actionSubscription = run.subscribe({
      next: (updated) => {
        apply(updated);
        this.actionSignal.set({ notificationId, action, status: 'succeeded', failure: null });
        this.refreshUnreadCount();
      },
      error: (error: unknown) => {
        const failure = toNotificationsFailure(error);
        this.actionSignal.set({ notificationId, action, status: 'failed', failure });
        // A notification that is gone or already changed leaves the shown page stale.
        if (failure === 'NOT_FOUND' || failure === 'VALIDATION_ERROR') {
          this.loadPage();
          this.refreshUnreadCount();
        }
      },
    });
  }

  private replaceNotification(notification: Notification): void {
    this.pageSignal.update((page) =>
      page === null
        ? null
        : {
            ...page,
            items: page.items.map((item) => (item.id === notification.id ? notification : item)),
          },
    );
  }

  private releaseInbox(): void {
    [this.pageSubscription, this.equipmentSubscription, this.actionSubscription].forEach(
      (subscription) => subscription?.unsubscribe(),
    );
    this.pageSubscription = null;
    this.equipmentSubscription = null;
    this.actionSubscription = null;
    this.pageIndexSignal.set(0);
    this.unreadOnlySignal.set(false);
    this.pageSignal.set(null);
    this.loadingSignal.set(false);
    this.failureSignal.set(null);
    this.equipmentNamesSignal.set(new Map());
    this.actionSignal.set(null);
  }
}
