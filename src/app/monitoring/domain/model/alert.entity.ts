import { BaseEntity } from '@shared/domain/model/base-entity';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus, isActiveAlertStatus } from '@monitoring/domain/value-objects/alert-status';

/**
 * Represents a thermal excursion or device offline alert raised for an equipment item.
 *
 * The triggering and peak temperatures are null for a DEVICE_OFFLINE alert. Each lifecycle step records
 * the IAM user who took it and when; `resolved_by` is null when the alert was resolved automatically
 * because the readings returned within range. `total_duration_seconds` is null while the alert is active.
 */
export class Alert implements BaseEntity {
  private _id: number;
  private _equipment_id: number;
  private _type: AlertType;
  private _severity: AlertSeverity;
  private _status: AlertStatus;
  private _triggering_reading_id: number | null;
  private _triggering_temperature: number | null;
  private _triggering_recorded_at: Date | null;
  private _peak_temperature: number | null;
  private _opened_at: Date;
  private _acknowledged_by: number | null;
  private _acknowledged_at: Date | null;
  private _resolved_by: number | null;
  private _resolved_at: Date | null;
  private _dismissed_by: number | null;
  private _dismissed_at: Date | null;
  private _dismiss_reason: string | null;
  private _dismiss_evidence: string | null;
  private _total_duration_seconds: number | null;

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
    triggering_reading_id: number | null;
    triggering_temperature: number | null;
    triggering_recorded_at: Date | null;
    peak_temperature: number | null;
    opened_at: Date;
    acknowledged_by: number | null;
    acknowledged_at: Date | null;
    resolved_by: number | null;
    resolved_at: Date | null;
    dismissed_by: number | null;
    dismissed_at: Date | null;
    dismiss_reason: string | null;
    dismiss_evidence: string | null;
    total_duration_seconds: number | null;
  }) {
    this._id = alert.id;
    this._equipment_id = alert.equipment_id;
    this._type = alert.type;
    this._severity = alert.severity;
    this._status = alert.status;
    this._triggering_reading_id = alert.triggering_reading_id;
    this._triggering_temperature = alert.triggering_temperature;
    this._triggering_recorded_at = alert.triggering_recorded_at;
    this._peak_temperature = alert.peak_temperature;
    this._opened_at = alert.opened_at;
    this._acknowledged_by = alert.acknowledged_by;
    this._acknowledged_at = alert.acknowledged_at;
    this._resolved_by = alert.resolved_by;
    this._resolved_at = alert.resolved_at;
    this._dismissed_by = alert.dismissed_by;
    this._dismissed_at = alert.dismissed_at;
    this._dismiss_reason = alert.dismiss_reason;
    this._dismiss_evidence = alert.dismiss_evidence;
    this._total_duration_seconds = alert.total_duration_seconds;
  }

  /**
   * Whether the alert is still active: OPEN or ACKNOWLEDGED.
   * @returns True while the alert is neither resolved nor dismissed.
   */
  isActive(): boolean {
    return isActiveAlertStatus(this._status);
  }

  /**
   * Whether the owner may acknowledge the alert; only an OPEN alert can be acknowledged.
   * @returns True for an OPEN alert.
   */
  canBeAcknowledged(): boolean {
    return this._status === AlertStatus.OPEN;
  }

  /**
   * Whether the owner may resolve or dismiss the alert; only an active alert can be closed.
   * @returns True for an OPEN or ACKNOWLEDGED alert.
   */
  canBeClosed(): boolean {
    return this.isActive();
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
  get triggering_reading_id(): number | null {
    return this._triggering_reading_id;
  }
  set triggering_reading_id(triggering_reading_id: number | null) {
    this._triggering_reading_id = triggering_reading_id;
  }
  get triggering_temperature(): number | null {
    return this._triggering_temperature;
  }
  set triggering_temperature(triggering_temperature: number | null) {
    this._triggering_temperature = triggering_temperature;
  }
  get triggering_recorded_at(): Date | null {
    return this._triggering_recorded_at;
  }
  set triggering_recorded_at(triggering_recorded_at: Date | null) {
    this._triggering_recorded_at = triggering_recorded_at;
  }
  get peak_temperature(): number | null {
    return this._peak_temperature;
  }
  set peak_temperature(peak_temperature: number | null) {
    this._peak_temperature = peak_temperature;
  }
  get opened_at(): Date {
    return this._opened_at;
  }
  set opened_at(opened_at: Date) {
    this._opened_at = opened_at;
  }
  get acknowledged_by(): number | null {
    return this._acknowledged_by;
  }
  set acknowledged_by(acknowledged_by: number | null) {
    this._acknowledged_by = acknowledged_by;
  }
  get acknowledged_at(): Date | null {
    return this._acknowledged_at;
  }
  set acknowledged_at(acknowledged_at: Date | null) {
    this._acknowledged_at = acknowledged_at;
  }
  get resolved_by(): number | null {
    return this._resolved_by;
  }
  set resolved_by(resolved_by: number | null) {
    this._resolved_by = resolved_by;
  }
  get resolved_at(): Date | null {
    return this._resolved_at;
  }
  set resolved_at(resolved_at: Date | null) {
    this._resolved_at = resolved_at;
  }
  get dismissed_by(): number | null {
    return this._dismissed_by;
  }
  set dismissed_by(dismissed_by: number | null) {
    this._dismissed_by = dismissed_by;
  }
  get dismissed_at(): Date | null {
    return this._dismissed_at;
  }
  set dismissed_at(dismissed_at: Date | null) {
    this._dismissed_at = dismissed_at;
  }
  get dismiss_reason(): string | null {
    return this._dismiss_reason;
  }
  set dismiss_reason(dismiss_reason: string | null) {
    this._dismiss_reason = dismiss_reason;
  }
  get dismiss_evidence(): string | null {
    return this._dismiss_evidence;
  }
  set dismiss_evidence(dismiss_evidence: string | null) {
    this._dismiss_evidence = dismiss_evidence;
  }
  get total_duration_seconds(): number | null {
    return this._total_duration_seconds;
  }
  set total_duration_seconds(total_duration_seconds: number | null) {
    this._total_duration_seconds = total_duration_seconds;
  }
}
