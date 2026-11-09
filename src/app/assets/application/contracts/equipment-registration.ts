import type { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';

/**
 * The data an owner gives to register an equipment item at one of their sites. It starts ACTIVE and
 * disconnected.
 */
export interface NewEquipment {
  readonly siteId: number;
  /** The unit's own identifier, unique across the platform; up to 30 characters. */
  readonly uid: string;
  /** Up to 30 characters. */
  readonly name: string;
  readonly type: EquipmentType;
  readonly threshold: TemperatureThreshold;
  /** The preventive maintenance interval, a positive number of days. */
  readonly reminderIntervalDays: number;
}

/**
 * The equipment data an owner may change. The uid, the site and the threshold are not editable here, and
 * changing these values keeps the equipment's telemetry and service history.
 */
export interface EquipmentChanges {
  /** Up to 30 characters. */
  readonly name: string;
  readonly type: EquipmentType;
  /** The preventive maintenance interval, a positive number of days. */
  readonly reminderIntervalDays: number;
}

/** The longest equipment name the backend accepts. */
export const EQUIPMENT_NAME_MAX_LENGTH = 30;
/** The longest equipment uid the backend accepts. */
export const EQUIPMENT_UID_MAX_LENGTH = 30;
