import { BaseEntity } from '@shared/domain/model/base-entity';
import { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';

/**
 * Represents a refrigeration equipment item installed at a site and monitored against its temperature threshold.
 *
 * `last_reading_at` and `last_known_temperature` are null while the equipment has not reported telemetry.
 */
export class Equipment implements BaseEntity {
  private _id: number;
  private _owner_id: number;
  private _equipment_code_uid: string;
  private _name: string;
  private _equipment_type: EquipmentType;
  private _status: StatusEquipment;
  private _site_id: number;
  private _online: boolean;
  private _reminder_interval_days: number;
  private _temperature_threshold: TemperatureThreshold;
  private _last_reading_at: Date | null;
  private _last_known_temperature: number | null;

  /**
   * Creates a new instance of the Equipment class.
   *
   * @param equipment - An object containing the properties of the equipment.
   */
  public constructor(equipment: {
    id: number;
    owner_id: number;
    equipment_code_uid: string;
    name: string;
    equipment_type: EquipmentType;
    status: StatusEquipment;
    site_id: number;
    online: boolean;
    reminder_interval_days: number;
    temperature_threshold: TemperatureThreshold;
    last_reading_at: Date | null;
    last_known_temperature: number | null;
  }) {
    this._id = equipment.id;
    this._owner_id = equipment.owner_id;
    this._equipment_code_uid = equipment.equipment_code_uid;
    this._name = equipment.name;
    this._equipment_type = equipment.equipment_type;
    this._status = equipment.status;
    this._site_id = equipment.site_id;
    this._online = equipment.online;
    this._reminder_interval_days = equipment.reminder_interval_days;
    this._temperature_threshold = equipment.temperature_threshold;
    this._last_reading_at = equipment.last_reading_at;
    this._last_known_temperature = equipment.last_known_temperature;
  }

  get id(): number {
    return this._id;
  }
  set id(id: number) {
    this._id = id;
  }
  get owner_id(): number {
    return this._owner_id;
  }
  set owner_id(owner_id: number) {
    this._owner_id = owner_id;
  }
  get equipment_code_uid(): string {
    return this._equipment_code_uid;
  }
  set equipment_code_uid(equipment_code_uid: string) {
    this._equipment_code_uid = equipment_code_uid;
  }
  get name(): string {
    return this._name;
  }
  set name(name: string) {
    this._name = name;
  }
  get equipment_type(): EquipmentType {
    return this._equipment_type;
  }
  set equipment_type(equipment_type: EquipmentType) {
    this._equipment_type = equipment_type;
  }
  get status(): StatusEquipment {
    return this._status;
  }
  set status(status: StatusEquipment) {
    this._status = status;
  }
  get site_id(): number {
    return this._site_id;
  }
  set site_id(site_id: number) {
    this._site_id = site_id;
  }
  get online(): boolean {
    return this._online;
  }
  set online(online: boolean) {
    this._online = online;
  }
  get reminder_interval_days(): number {
    return this._reminder_interval_days;
  }
  set reminder_interval_days(reminder_interval_days: number) {
    this._reminder_interval_days = reminder_interval_days;
  }
  get temperature_threshold(): TemperatureThreshold {
    return this._temperature_threshold;
  }
  set temperature_threshold(temperature_threshold: TemperatureThreshold) {
    this._temperature_threshold = temperature_threshold;
  }
  get last_reading_at(): Date | null {
    return this._last_reading_at;
  }
  set last_reading_at(last_reading_at: Date | null) {
    this._last_reading_at = last_reading_at;
  }
  get last_known_temperature(): number | null {
    return this._last_known_temperature;
  }
  set last_known_temperature(last_known_temperature: number | null) {
    this._last_known_temperature = last_known_temperature;
  }

  /**
   * Checks whether a temperature is outside the threshold of the equipment. It only describes a value;
   * raising alerts for excursions remains a backend responsibility.
   * @param temperature - The temperature, in degrees Celsius.
   * @returns True when the temperature is below the minimum or above the maximum.
   */
  isOutRange(temperature: number): boolean {
    return (
      temperature < this._temperature_threshold.min_celsius ||
      temperature > this._temperature_threshold.max_celsius
    );
  }
}
