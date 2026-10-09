import { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';
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
  [NotificationType.DEVICE_OFFLINE]: 'wifi-off',
  [NotificationType.LOW_BATTERY]: 'bolt',
  [NotificationType.SENSOR_FAILURE]: 'cpu',
  [NotificationType.SERVICE_REQUEST_UPDATE]: 'file-text',
  [NotificationType.OUT_OF_RANGER_TEMPERATURE]: 'temperature',
};

/** The notification types raised by a monitoring alert, which link to that alert. */
export const ALERT_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  NotificationType.OUT_OF_RANGER_TEMPERATURE,
  NotificationType.DEVICE_OFFLINE,
]);
