import { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';
import type { NotificationsFailure } from '@notifications/application/contracts/notifications-error';
import type { NotificationAction } from '@notifications/application/notifications-store';
import type { IconName } from '@shared/presentation/components/icon/icon';
import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';

/** How each notification severity is shown, together with its translated label. */
export const NOTIFICATION_SEVERITY_APPEARANCE: Readonly<
  Record<NotificationSeverity, StatusAppearance>
> = {
  [NotificationSeverity.INFO]: { tone: 'info', icon: 'info-circle' },
  [NotificationSeverity.WARNING]: { tone: 'warning', icon: 'alert-triangle' },
  [NotificationSeverity.CRITICAL]: { tone: 'critical', icon: 'circle-x' },
};

/** The icon of each notification type. */
export const NOTIFICATION_TYPE_ICONS: Readonly<Record<NotificationType, IconName>> = {
  [NotificationType.MAINTENANCE_REMINDER]: 'tools',
  [NotificationType.TEMPERATURE_EXCURSION]: 'temperature',
  [NotificationType.DEVICE_OFFLINE]: 'wifi-off',
  [NotificationType.LOW_BATTERY]: 'bolt',
  [NotificationType.SENSOR_FAILURE]: 'cpu',
  [NotificationType.SERVICE_REQUEST_UPDATE]: 'file-text',
  [NotificationType.MAINTENANCE_WINDOW]: 'calendar',
  [NotificationType.UNLINKED_MAINTENANCE_WINDOW]: 'calendar',
};

/** The confirmation announced when a notification action succeeds. */
export const NOTIFICATION_ACTION_SUCCESS_KEYS: Readonly<Record<NotificationAction, string>> = {
  read: 'notifications.center.markedAsRead',
  dismiss: 'notifications.center.dismissed',
};

/**
 * Resolves the translation key shown when a notification action fails. Backend messages are never shown.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function notificationActionErrorKey(failure: NotificationsFailure | null): string {
  switch (failure) {
    case 'NOT_FOUND':
    case 'VALIDATION_ERROR':
      return 'notifications.errors.notificationChanged';
    case 'ACCESS_DENIED':
      return 'notifications.errors.accessDenied';
    default:
      return 'notifications.errors.unexpected';
  }
}
