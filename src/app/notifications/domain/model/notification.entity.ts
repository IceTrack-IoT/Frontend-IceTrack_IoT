import { BaseEntity } from '@shared/domain/model/base-entity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';
import { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';

/**
 * Represents a notification in the inbox of the signed-in user.
 *
 * `equipment_id`, `device_id` and `source_alert_id` are null when the notification does not concern an
 * equipment item, a device or an alert. `message` is composed by the backend in English; `message_key`
 * names the template it was composed from and `message_params` the values filled into it (strings or
 * numbers, never markup), so it can be shown in the user's language. `read_at` is null
 * while unread and `dismissed_at` while not dismissed; the active inbox holds only notifications that are
 * not dismissed.
 */
export class Notification implements BaseEntity {
  private _id: number;
  private _recipient_user_id: number;
  private _equipment_id: number | null;
  private _device_id: number | null;
  private _source_alert_id: number | null;
  private _service_request_id: number | null;
  private _message: string;
  private _message_key: string;
  private _message_params: Readonly<Record<string, string | number>>;
  private _type: NotificationType;
  private _severity: NotificationSeverity;
  private _is_read: boolean;
  private _created_at: Date;
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
    service_request_id: number | null;
    message: string;
    message_key: string;
    message_params: Readonly<Record<string, string | number>>;
    type: NotificationType;
    severity: NotificationSeverity;
    is_read: boolean;
    created_at: Date;
    read_at: Date | null;
    dismissed_at: Date | null;
  }) {
    this._id = notification.id;
    this._recipient_user_id = notification.recipient_user_id;
    this._equipment_id = notification.equipment_id;
    this._device_id = notification.device_id;
    this._source_alert_id = notification.source_alert_id;
    this._service_request_id = notification.service_request_id;
    this._message = notification.message;
    this._message_key = notification.message_key;
    this._message_params = notification.message_params;
    this._type = notification.type;
    this._severity = notification.severity;
    this._is_read = notification.is_read;
    this._created_at = notification.created_at;
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
  /** The service request the notification is about, or null when it concerns none. */
  get service_request_id(): number | null {
    return this._service_request_id;
  }
  get message(): string {
    return this._message;
  }
  /** The stable key of the message template; `notification.untemplated` for older notifications. */
  get message_key(): string {
    return this._message_key;
  }
  /** The values filled into the template; a value unknown when it was raised is left out. */
  get message_params(): Readonly<Record<string, string | number>> {
    return this._message_params;
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
  /** When the notification was raised; the inbox is ordered by it, most recent first. */
  get created_at(): Date {
    return this._created_at;
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
