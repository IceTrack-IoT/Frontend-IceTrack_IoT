import { Notification } from '@notifications/domain/model/notification.entity';
import { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';

/**
 * Mocked data of the notification center.
 * TODO: Replace with the NotificationsStore once the notifications use cases are implemented.
 */

const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60_000);

/**
 * Names of the equipment referenced by the notifications. The notification only carries the equipment
 * identifier; the name comes from Assets Management.
 */
export const NOTIFICATION_EQUIPMENT_NAMES: Readonly<Record<number, string>> = {
  1: 'Walk-In Freezer #02',
  2: 'Walk-In Freezer #04',
  4: 'Display Chiller #05',
  7: 'Cold Room #03',
  8: 'Blast Freezer #07',
  9: 'Reach-In Refrigerator #11',
};

/**
 * Creates the mocked notifications of the owner, newest first. Each call returns new instances.
 * @returns The mocked notifications.
 */
export function createNotificationsMock(): Notification[] {
  return [
    new Notification({
      id: 101,
      equipment_id: 1,
      device_id: 4401,
      source_alert_id: 1,
      message: 'Walk-In Freezer #02 reached -12.1 °C, above its maximum of -16.0 °C.',
      type: NotificationType.OUT_OF_RANGER_TEMPERATURE,
      severity: NotificationSeverity.CRITICAL,
      is_read: false,
      read_at: null,
      dismissed_at: null,
    }),
    new Notification({
      id: 102,
      equipment_id: 4,
      device_id: 4404,
      source_alert_id: 2,
      message: 'Display Chiller #05 is at 4.7 °C, within 0.3 °C of its maximum of 5.0 °C.',
      type: NotificationType.OUT_OF_RANGER_TEMPERATURE,
      severity: NotificationSeverity.WARNING,
      is_read: false,
      read_at: null,
      dismissed_at: null,
    }),
    new Notification({
      id: 103,
      equipment_id: 7,
      device_id: 4407,
      source_alert_id: 3,
      message: 'The monitoring device of Cold Room #03 stopped reporting 47 minutes ago.',
      type: NotificationType.DEVICE_OFFLINE,
      severity: NotificationSeverity.CRITICAL,
      is_read: false,
      read_at: null,
      dismissed_at: null,
    }),
    new Notification({
      id: 104,
      equipment_id: 4,
      device_id: 4404,
      source_alert_id: 2,
      message: 'Carlos Mendoza accepted the repair request for Display Chiller #05.',
      type: NotificationType.SERVICE_REQUEST_UPDATE,
      severity: NotificationSeverity.INFO,
      is_read: false,
      read_at: null,
      dismissed_at: null,
    }),
    new Notification({
      id: 105,
      equipment_id: 9,
      device_id: 4409,
      source_alert_id: 4,
      message:
        'The sensor battery of Reach-In Refrigerator #11 is at 12%. Replace it within 4 days.',
      type: NotificationType.LOW_BATTERY,
      severity: NotificationSeverity.WARNING,
      is_read: true,
      read_at: minutesAgo(180),
      dismissed_at: null,
    }),
    new Notification({
      id: 106,
      equipment_id: 8,
      device_id: 4408,
      source_alert_id: 5,
      message: 'Preventive maintenance of Blast Freezer #07 is due in 4 days.',
      type: NotificationType.MAINTENANCE_REMINDER,
      severity: NotificationSeverity.INFO,
      is_read: true,
      read_at: minutesAgo(1_300),
      dismissed_at: null,
    }),
    new Notification({
      id: 107,
      equipment_id: 2,
      device_id: 4402,
      source_alert_id: 7,
      message:
        'The temperature probe of Walk-In Freezer #04 reported inconsistent values for 3 minutes.',
      type: NotificationType.SENSOR_FAILURE,
      severity: NotificationSeverity.WARNING,
      is_read: true,
      read_at: minutesAgo(2_900),
      dismissed_at: null,
    }),
    new Notification({
      id: 108,
      equipment_id: 2,
      device_id: 4402,
      source_alert_id: 7,
      message: 'The preventive maintenance of Walk-In Freezer #04 was completed by Carlos Mendoza.',
      type: NotificationType.SERVICE_REQUEST_UPDATE,
      severity: NotificationSeverity.INFO,
      is_read: true,
      read_at: minutesAgo(2_950),
      dismissed_at: null,
    }),
  ];
}
