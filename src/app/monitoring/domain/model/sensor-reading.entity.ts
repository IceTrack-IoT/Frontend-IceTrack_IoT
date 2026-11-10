import { BaseEntity } from '@shared/domain/model/base-entity';

/**
 * Represents an aggregated temperature and humidity reading batch reported by a device for an equipment
 * item. Temperatures are calibrated, in Celsius; `reading_uid` identifies the batch across the platform.
 *
 * `id` is null for a reading received through the live telemetry stream, which does not carry the stored
 * identifier. `under_maintenance` is true when a maintenance window covered `recorded_at`; such readings
 * never change an alert.
 */
export class SensorReading implements BaseEntity<number | null> {
  private _id: number | null;
  private _reading_uid: string;
  private _equipment_id: number;
  private _device_id: number;
  private _min_temperature: number;
  private _max_temperature: number;
  private _avg_temperature: number;
  private _humidity: number;
  private _sample_count: number;
  private _recorded_at: Date;
  private _under_maintenance: boolean;

  /**
   * Creates a new instance of the SensorReading class.
   *
   * @param sensorReading - An object containing the properties of the sensor reading.
   */
  public constructor(sensorReading: {
    id: number | null;
    reading_uid: string;
    equipment_id: number;
    device_id: number;
    min_temperature: number;
    max_temperature: number;
    avg_temperature: number;
    humidity: number;
    sample_count: number;
    recorded_at: Date;
    under_maintenance: boolean;
  }) {
    this._id = sensorReading.id;
    this._reading_uid = sensorReading.reading_uid;
    this._equipment_id = sensorReading.equipment_id;
    this._device_id = sensorReading.device_id;
    this._min_temperature = sensorReading.min_temperature;
    this._max_temperature = sensorReading.max_temperature;
    this._avg_temperature = sensorReading.avg_temperature;
    this._humidity = sensorReading.humidity;
    this._sample_count = sensorReading.sample_count;
    this._recorded_at = sensorReading.recorded_at;
    this._under_maintenance = sensorReading.under_maintenance;
  }

  get id(): number | null {
    return this._id;
  }
  set id(id: number | null) {
    this._id = id;
  }
  get reading_uid(): string {
    return this._reading_uid;
  }
  set reading_uid(reading_uid: string) {
    this._reading_uid = reading_uid;
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
  get min_temperature(): number {
    return this._min_temperature;
  }
  set min_temperature(min_temperature: number) {
    this._min_temperature = min_temperature;
  }
  get max_temperature(): number {
    return this._max_temperature;
  }
  set max_temperature(max_temperature: number) {
    this._max_temperature = max_temperature;
  }
  get avg_temperature(): number {
    return this._avg_temperature;
  }
  set avg_temperature(avg_temperature: number) {
    this._avg_temperature = avg_temperature;
  }
  get humidity(): number {
    return this._humidity;
  }
  set humidity(humidity: number) {
    this._humidity = humidity;
  }
  get sample_count(): number {
    return this._sample_count;
  }
  set sample_count(sample_count: number) {
    this._sample_count = sample_count;
  }
  get recorded_at(): Date {
    return this._recorded_at;
  }
  set recorded_at(recorded_at: Date) {
    this._recorded_at = recorded_at;
  }
  get under_maintenance(): boolean {
    return this._under_maintenance;
  }
  set under_maintenance(under_maintenance: boolean) {
    this._under_maintenance = under_maintenance;
  }
}
