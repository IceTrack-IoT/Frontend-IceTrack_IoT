import { BaseEntity } from '@shared/domain/model/base-entity';

/** Seconds of one synchronization window of an edge device: it sends one reading batch per window. */
export const SYNC_WINDOW_SECONDS = 60;

/**
 * Missed synchronization windows after which the platform-wide default policy considers a device offline.
 * Used only when the policy of an equipment item could not be read.
 */
export const DEFAULT_MISSED_SYNC_WINDOWS_FOR_OFFLINE = 3;

/**
 * Seconds without a reading after which a unit is considered offline.
 * @param missedSyncWindows - The missed synchronization windows of the applicable policy.
 * @returns The silence, in seconds, that marks the unit offline.
 */
export function offlineAfterSeconds(missedSyncWindows: number): number {
  return SYNC_WINDOW_SECONDS * missedSyncWindows;
}

/**
 * Represents the policy that decides when the readings of an equipment item raise an alert. The
 * platform-wide default policy has no equipment.
 */
export class AlertPolicy implements BaseEntity {
  private _id: number;
  private _equipment_id: number | null;
  private _sustained_excursion_minutes: number;
  private _hysteresis_margin_celsius: number;
  private _missed_sync_windows_for_offline: number;
  private _active: boolean;

  /**
   * Creates a new instance of the AlertPolicy class.
   *
   * @param alertPolicy - An object containing the properties of the alert policy.
   */
  public constructor(alertPolicy: {
    id: number;
    equipment_id: number | null;
    sustained_excursion_minutes: number;
    hysteresis_margin_celsius: number;
    missed_sync_windows_for_offline: number;
    active: boolean;
  }) {
    this._id = alertPolicy.id;
    this._equipment_id = alertPolicy.equipment_id;
    this._sustained_excursion_minutes = alertPolicy.sustained_excursion_minutes;
    this._hysteresis_margin_celsius = alertPolicy.hysteresis_margin_celsius;
    this._missed_sync_windows_for_offline = alertPolicy.missed_sync_windows_for_offline;
    this._active = alertPolicy.active;
  }

  /**
   * Whether this is the platform-wide default policy rather than one specific to the equipment.
   * @returns True when the policy has no equipment.
   */
  isPlatformDefault(): boolean {
    return this._equipment_id === null;
  }

  get id(): number {
    return this._id;
  }
  set id(id: number) {
    this._id = id;
  }
  get equipment_id(): number | null {
    return this._equipment_id;
  }
  set equipment_id(equipment_id: number | null) {
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
  get active(): boolean {
    return this._active;
  }
  set active(active: boolean) {
    this._active = active;
  }
}
