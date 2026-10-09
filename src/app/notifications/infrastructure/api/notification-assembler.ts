import { BaseAssembler } from '@shared/infrastructure/api/base-assembler';
import { Notification } from '@notifications/domain/model/notification.entity';
import {
  NotificationResource,
  NotificationResponse,
} from '@notifications/infrastructure/api/notification.response';
import { isNotificationType, NotificationType } from '@notifications/domain/value-objects/notification-type';
import { isNotificationSeverity, NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';

/**
 * NotificationAssembler is responsible for converting between Notification entities and their corresponding API resources and responses.
 */
export class NotificationAssembler implements BaseAssembler<
  Notification,
  NotificationResource,
  NotificationResponse
> {
  /**
   * Converts a NotificationResource to a Notification entity.
   * @param resource - The NotificationResource to convert.
   * @returns The corresponding Notification entity.
   */
  toEntityFromResource(resource: NotificationResource): Notification {
    return new Notification({
      id: resource.id,
      equipment_id: resource.equipment_id,
      device_id: resource.device_id,
      source_alert_id: resource.source_alert_id,
      message: resource.message,
      type: this.toNotificationType(resource.type),
      severity: this.toNotificationSeverity(resource.severity),
      is_read: resource.is_read,
      read_at: resource.read_at,
      dismissed_at: resource.dismissed_at,
    });
  }

  /**
   * Converts a Notification entity to a NotificationResource.
   * @param entity - The Notification entity to convert.
   * @returns The corresponding NotificationResource.
   */
  toResourceFromEntity(entity: Notification): NotificationResource {
    return {
      id: entity.id,
      equipment_id: entity.equipment_id,
      device_id: entity.device_id,
      source_alert_id: entity.source_alert_id,
      message: entity.message,
      type: entity.type,
      severity: entity.severity,
      is_read: entity.is_read,
      read_at: entity.read_at,
      dismissed_at: entity.dismissed_at,
    } as NotificationResource;
  }

  /**
   * Converts a NotificationResponse to an array of Notification entities.
   * @param response - The NotificationResponse to convert.
   * @returns An array of corresponding Notification entities.
   */
  toEntitiesFromResponse(response: NotificationResponse): Notification[] {
    return response.notifications.map((resource) =>
      this.toEntityFromResource(resource as NotificationResource),
    );
  }

  /**
   * Converts a string value to a NotificationType enum value.
   * @param value - The string value to convert.
   * @returns The corresponding NotificationType enum value.
   * @throws Error if the value is not a valid NotificationType.
   * @private
   */
  private toNotificationType(value: string): NotificationType {
    if (!isNotificationType(value)) {
      throw new Error(`Unsupported notification type: ${value}`);
    }
    return value;
  }

  /**
   * Converts a string value to a NotificationSeverity enum value.
   * @param value - The string value to convert.
   * @returns The corresponding NotificationSeverity enum value.
   * @throws Error if the value is not a valid NotificationSeverity.
   * @private
   */
  private toNotificationSeverity(value: string): NotificationSeverity {
    if (!isNotificationSeverity(value)) {
      throw new Error(`Unsupported notification severity: ${value}`);
    }
    return value;
  }
}
