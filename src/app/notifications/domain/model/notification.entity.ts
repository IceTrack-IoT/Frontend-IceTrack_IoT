import { BaseEntity } from '@shared/domain/model/base-entity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';
import { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';

/**
 * Represents a notification in the inbox of the signed-in user.
 *
 * `equipment_id`, `device_id` and `source_alert_id` are null when the notification does not concern an
 * equipment item, a device or an alert. `message` is composed by the backend in English. `read_at` is null
 * while unread and `dismissed_at` while not dismissed; the active inbox holds only notifications that are
 * not dismissed.
 */
export class Notification implements BaseEntity {
  private _id: number;
  private _recipient_user_id: number;
  private _equipment_id: number | null;
  private _device_id: number | null;
  private _source_alert_id: number | null;
  private _message: string;
  private _type: NotificationType;
  private _severity: NotificationSeverity;
  private _is_read: boolean;
  private _read_at: Date | null;
  private _dismissed_at: Date | null;

  /**
   * Creates a new instance of the Notification class.
   * @param notification - An object containing the properties of the notification.
   */
  constructor(notification: {
    id: number;
    recipient_user_id: number;
    equipment_id: number | null;
    device_id: number | null;
    source_alert_id: number | null;
    message: string;
    type: NotificationType;
    severity: NotificationSeverity;
    is_read: boolean;
    read_at: Date | null;
    dismissed_at: Date | null;
  }) {
    this._id = notification.id;
    this._recipient_user_id = notification.recipient_user_id;
    this._equipment_id = notification.equipment_id;
    this._device_id = notification.device_id;
    this._source_alert_id = notification.source_alert_id;
    this._message = notification.message;
    this._type = notification.type;
    this._severity = notification.severity;
    this._is_read = notification.is_read;
    this._read_at = notification.read_at;
    this._dismissed_at = notification.dismissed_at;
  }

  get id(): number {
    return this._id;
  }
  get recipient_user_id(): number {
    return this._recipient_user_id;
  }
  get equipment_id(): number | null {
    return this._equipment_id;
  }
  get device_id(): number | null {
    return this._device_id;
  }
  get source_alert_id(): number | null {
    return this._source_alert_id;
  }
  get message(): string {
    return this._message;
  }
  get type(): NotificationType {
    return this._type;
  }
  get severity(): NotificationSeverity {
    return this._severity;
  }
  get is_read(): boolean {
    return this._is_read;
  }
  get read_at(): Date | null {
    return this._read_at;
  }
  get dismissed_at(): Date | null {
    return this._dismissed_at;
  }

  /**
   * Whether the notification can still be marked as read.
   * @returns True while it is unread and not dismissed.
   */
  canBeMarkedAsRead(): boolean {
    return !this._is_read && this._dismissed_at === null;
  }

  /**
   * Whether the notification can still be dismissed from the active inbox.
   * @returns True while it is not dismissed.
   */
  canBeDismissed(): boolean {
    return this._dismissed_at === null;
  }
}
