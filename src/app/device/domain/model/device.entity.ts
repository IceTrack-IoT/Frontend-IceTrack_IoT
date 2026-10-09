import { BaseEntity } from '@shared/domain/model/base-entity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';

/**
 * Represents a monitoring device that reports the telemetry of the equipment it is paired to.
 *
 * `equipment_id` is null while the device is unpaired, `api_key_hash` is null when the device has no
 * active credential and `last_read` is null until the device reports its first reading. The plain API key
 * is never part of the model: only its hash is.
 */
export class Device implements BaseEntity {
  private _id: number;
  private _equipment_id: number | null;
  private _board_model: string;
  private _firmware_version: string;
  private _api_key_hash: string | null;
  private _status: DeviceStatus;
  private _last_read: Date | null;

  /**
   * Creates a new instance of the Device class.
   *
   * @param device - An object containing the properties of the device.
   */
  public constructor(device: {
    id: number;
    equipment_id: number | null;
    board_model: string;
    firmware_version: string;
    api_key_hash: string | null;
    status: DeviceStatus;
    last_read: Date | null;
  }) {
    this._id = device.id;
    this._equipment_id = device.equipment_id;
    this._board_model = device.board_model;
    this._firmware_version = device.firmware_version;
    this._api_key_hash = device.api_key_hash;
    this._status = device.status;
    this._last_read = device.last_read;
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
  get board_model(): string {
    return this._board_model;
  }
  set board_model(board_model: string) {
    this._board_model = board_model;
  }
  get firmware_version(): string {
    return this._firmware_version;
  }
  set firmware_version(firmware_version: string) {
    this._firmware_version = firmware_version;
  }
  get api_key_hash(): string | null {
    return this._api_key_hash;
  }
  set api_key_hash(api_key_hash: string | null) {
    this._api_key_hash = api_key_hash;
  }
  get status(): DeviceStatus {
    return this._status;
  }
  set status(status: DeviceStatus) {
    this._status = status;
  }
  get last_read(): Date | null {
    return this._last_read;
  }
  set last_read(last_read: Date | null) {
    this._last_read = last_read;
  }
}
