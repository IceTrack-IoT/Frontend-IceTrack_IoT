import { BaseEntity } from '@shared/domain/model/base-entity';

/**
 * Represents an aggregated temperature and humidity reading reported by a device for an equipment item.
 */
export class SensorReading implements BaseEntity {
  private _id: number;
  private _equipment_id: number;
  private _device_id: number;
  private _min_temperature: number;
  private _max_temperature: number;
  private _average_temperature: number;
  private _humidity: number;
  private _recorded_at: Date;
  private _received_at: Date;

  /**
   * Creates a new instance of the SensorReading class.
   *
   * @param sensorReading - An object containing the properties of the sensor reading.
   */
  public constructor(sensorReading: {
    id: number;
    equipment_id: number;
    device_id: number;
    min_temperature: number;
    max_temperature: number;
    average_temperature: number;
    humidity: number;
    recorded_at: Date;
    received_at: Date;
  }) {
    this._id = sensorReading.id;
    this._equipment_id = sensorReading.equipment_id;
    this._device_id = sensorReading.device_id;
    this._min_temperature = sensorReading.min_temperature;
    this._max_temperature = sensorReading.max_temperature;
    this._average_temperature = sensorReading.average_temperature;
    this._humidity = sensorReading.humidity;
    this._recorded_at = sensorReading.recorded_at;
    this._received_at = sensorReading.received_at;
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
  get average_temperature(): number {
    return this._average_temperature;
  }
  set average_temperature(average_temperature: number) {
    this._average_temperature = average_temperature;
  }
  get humidity(): number {
    return this._humidity;
  }
  set humidity(humidity: number) {
    this._humidity = humidity;
  }
  get recorded_at(): Date {
    return this._recorded_at;
  }
  set recorded_at(recorded_at: Date) {
    this._recorded_at = recorded_at;
  }
  get received_at(): Date {
    return this._received_at;
  }
  set received_at(received_at: Date) {
    this._received_at = received_at;
  }
}
