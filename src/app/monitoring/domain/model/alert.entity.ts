import { BaseEntity } from '@shared/domain/model/base-entity';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';

/**
 * Represents a thermal or connectivity alert raised for an equipment item.
 *
 * `trigger_reading_id`, `peak_temperature` and `excursion_duration` (minutes) are null for alerts without a
 * temperature excursion, such as a device going offline. `resolved_at` is null while the alert is open.
 */
export class Alert implements BaseEntity {
  private _id: number;
  private _equipment_id: number;
  private _type: AlertType;
  private _severity: AlertSeverity;
  private _status: AlertStatus;
  private _trigger_reading_id: number | null;
  private _peak_temperature: number | null;
  private _excursion_duration: number | null;
  private _opened_at: Date;
  private _resolved_at: Date | null;

  /**
   * Creates a new instance of the Alert class.
   *
   * @param alert - An object containing the properties of the alert.
   */
  public constructor(alert: {
    id: number;
    equipment_id: number;
    type: AlertType;
    severity: AlertSeverity;
    status: AlertStatus;
    trigger_reading_id: number | null;
    peak_temperature: number | null;
    excursion_duration: number | null;
    opened_at: Date;
    resolved_at: Date | null;
  }) {
    this._id = alert.id;
    this._equipment_id = alert.equipment_id;
    this._type = alert.type;
    this._severity = alert.severity;
    this._status = alert.status;
    this._trigger_reading_id = alert.trigger_reading_id;
    this._peak_temperature = alert.peak_temperature;
    this._excursion_duration = alert.excursion_duration;
    this._opened_at = alert.opened_at;
    this._resolved_at = alert.resolved_at;
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
  get type(): AlertType {
    return this._type;
  }
  set type(type: AlertType) {
    this._type = type;
  }
  get severity(): AlertSeverity {
    return this._severity;
  }
  set severity(severity: AlertSeverity) {
    this._severity = severity;
  }
  get status(): AlertStatus {
    return this._status;
  }
  set status(status: AlertStatus) {
    this._status = status;
  }
  get trigger_reading_id(): number | null {
    return this._trigger_reading_id;
  }
  set trigger_reading_id(trigger_reading_id: number | null) {
    this._trigger_reading_id = trigger_reading_id;
  }
  get peak_temperature(): number | null {
    return this._peak_temperature;
  }
  set peak_temperature(peak_temperature: number | null) {
    this._peak_temperature = peak_temperature;
  }
  get excursion_duration(): number | null {
    return this._excursion_duration;
  }
  set excursion_duration(excursion_duration: number | null) {
    this._excursion_duration = excursion_duration;
  }
  get opened_at(): Date {
    return this._opened_at;
  }
  set opened_at(opened_at: Date) {
    this._opened_at = opened_at;
  }
  get resolved_at(): Date | null {
    return this._resolved_at;
  }
  set resolved_at(resolved_at: Date | null) {
    this._resolved_at = resolved_at;
  }
}
