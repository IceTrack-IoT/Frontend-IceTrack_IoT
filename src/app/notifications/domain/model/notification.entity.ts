import { BaseEntity } from '@shared/domain/model/base-entity';
import { NotificationType } from '@notifications/domain/value-objects/notification-type';
import { NotificationSeverity } from '@notifications/domain/value-objects/notification-severity';

/**
 * Notification entity class representing a notification in the system.
 */
export class Notification implements BaseEntity {
  private _id: number;
  private _equipment_id: number;
  private _device_id: number;
  private _source_alert_id: number;
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
    equipment_id: number;
    device_id: number;
    source_alert_id: number;
    message: string;
    type: NotificationType;
    severity: NotificationSeverity;
    is_read: boolean;
    read_at: Date | null;
    dismissed_at: Date | null;
  }) {
    this._id = notification.id;
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
  set id(id: number) {
    this._id = id;
  }
  get equipment_id(): number {
    return this._equipment_id;
  }
  set equipment_id(equipment_id: number) {
    this._equipment_id = equipment_id;
  }
  get device_id(): number {
    return this._device_id;
  }
  set device_id(device_id: number) {
    this._device_id = device_id;
  }
  get source_alert_id(): number {
    return this._source_alert_id;
  }
  set source_alert_id(source_alert_id: number) {
    this._source_alert_id = source_alert_id;
  }
  get message(): string {
    return this._message;
  }
  set message(message: string) {
    this._message = message;
  }
  get type(): NotificationType {
    return this._type;
  }
  set type(type: NotificationType) {
    this._type = type;
  }
  get severity(): NotificationSeverity {
    return this._severity;
  }
  set severity(severity: NotificationSeverity) {
    this._severity = severity;
  }
  get is_read(): boolean {
    return this._is_read;
  }
  set is_read(is_read: boolean) {
    this._is_read = is_read;
  }
  get read_at(): Date | null {
    return this._read_at;
  }
  set read_at(read_at: Date | null) {
    this._read_at = read_at;
  }
  get dismissed_at(): Date | null {
    return this._dismissed_at;
  }
  set dismissed_at(dismissed_at: Date | null) {
    this._dismissed_at = dismissed_at;
  }
}
