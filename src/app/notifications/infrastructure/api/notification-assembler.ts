import { Notification } from '@notifications/domain/model/notification.entity';
import { isNotificationSeverity } from '@notifications/domain/value-objects/notification-severity';
import { isNotificationType } from '@notifications/domain/value-objects/notification-type';
import type { NotificationPage } from '@notifications/application/contracts/notification-page';
import type {
  NotificationResource,
  PagedNotificationResource,
} from '@notifications/infrastructure/api/notification.response';

/**
 * NotificationAssembler converts the Notifications resources into domain entities and application
 * contracts.
 *
 * A notification carrying a type or severity outside the documented enumerations, or an unreadable
 * instant, is rejected with an error instead of being shown wrongly.
 */
export class NotificationAssembler {
  /**
   * Converts a NotificationResource to a Notification entity.
   * @param resource - The resource to convert.
   * @returns The corresponding Notification entity.
   */
  toNotificationFromResource(resource: NotificationResource): Notification {
    const { type, severity } = resource;
    if (!isNotificationType(type) || !isNotificationSeverity(severity)) {
      throw new Error('The notification has an unknown type or severity.');
    }
    return new Notification({
      id: resource.id,
      recipient_user_id: resource.recipient_user_id,
      equipment_id: resource.equipment_id ?? null,
      device_id: resource.device_id ?? null,
      source_alert_id: resource.source_alert_id ?? null,
      service_request_id: resource.service_request_id ?? null,
      message: resource.message,
      type,
      severity,
      is_read: resource.is_read,
      created_at: toInstant(resource.created_at),
      read_at: toOptionalInstant(resource.read_at),
      dismissed_at: toOptionalInstant(resource.dismissed_at),
    });
  }

  /**
   * Converts a PagedNotificationResource to a page of notifications.
   * @param resource - The resource to convert.
   * @returns The page.
   */
  toNotificationPageFromResource(resource: PagedNotificationResource): NotificationPage {
    return {
      items: resource.items.map((item) => this.toNotificationFromResource(item)),
      page: resource.page,
      size: resource.size,
      totalElements: resource.total_elements,
      totalPages: Math.max(1, resource.total_pages),
    };
  }
}

function toOptionalInstant(value: string | null | undefined): Date | null {
  return value === null || value === undefined ? null : toInstant(value);
}

function toInstant(value: string): Date {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    throw new Error('The notification resource has an unreadable instant.');
  }
  return instant;
}
