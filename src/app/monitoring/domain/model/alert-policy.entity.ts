import { BaseEntity } from '@shared/domain/model/base-entity';

/**
 * Represents the policy that decides when the readings of an equipment item raise an alert.
 */
export class AlertPolicy implements BaseEntity {
  private _id: number;
  private _equipment_id: number;
  private _sustained_excursion_minutes: number;
  private _hysteresis_margin_celsius: number;
  private _missed_sync_windows_for_offline: number;
  private _is_active: boolean;

  /**
   * Creates a new instance of the AlertPolicy class.
   *
   * @param alertPolicy - An object containing the properties of the alert policy.
   */
  public constructor(alertPolicy: {
    id: number;
    equipment_id: number;
    sustained_excursion_minutes: number;
    hysteresis_margin_celsius: number;
    missed_sync_windows_for_offline: number;
    is_active: boolean;
  }) {
    this._id = alertPolicy.id;
    this._equipment_id = alertPolicy.equipment_id;
    this._sustained_excursion_minutes = alertPolicy.sustained_excursion_minutes;
    this._hysteresis_margin_celsius = alertPolicy.hysteresis_margin_celsius;
    this._missed_sync_windows_for_offline = alertPolicy.missed_sync_windows_for_offline;
    this._is_active = alertPolicy.is_active;
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
  get sustained_excursion_minutes(): number {
    return this._sustained_excursion_minutes;
  }
  set sustained_excursion_minutes(sustained_excursion_minutes: number) {
    this._sustained_excursion_minutes = sustained_excursion_minutes;
  }
  get hysteresis_margin_celsius(): number {
    return this._hysteresis_margin_celsius;
  }
  set hysteresis_margin_celsius(hysteresis_margin_celsius: number) {
    this._hysteresis_margin_celsius = hysteresis_margin_celsius;
  }
  get missed_sync_windows_for_offline(): number {
    return this._missed_sync_windows_for_offline;
  }
  set missed_sync_windows_for_offline(missed_sync_windows_for_offline: number) {
    this._missed_sync_windows_for_offline = missed_sync_windows_for_offline;
  }
  get is_active(): boolean {
    return this._is_active;
  }
  set is_active(is_active: boolean) {
    this._is_active = is_active;
  }
}
