import { BaseEntity } from '@shared/domain/model/base-entity';
import type { DeviceConnectivity } from '@device/domain/value-objects/device-connectivity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';

/**
 * Represents an ESP32 monitoring board that reports the telemetry of the equipment it is paired with.
 *
 * `paired_equipment_id` is null while the device is unpaired, `firmware_version` is null when it was not
 * declared, and `last_seen_at` is the arrival time of the device's latest reading batch (null until its
 * first one). `connectivity` is the server's evaluation of whether the board is reporting. The API key is
 * never part of the model: the backend returns it only once, when it is issued.
 *
 * Lifecycle: an UNPAIRED device is paired with a fresh key; a PAIRED device can be REVOKED (the key stops
 * working but the device stays linked); rotating the key of a PAIRED or REVOKED device issues a new one
 * and leaves it PAIRED; a PAIRED or REVOKED device can be unpaired.
 */
export class Device implements BaseEntity {
  private _id: number;
  private _device_uid: string;
  private _board_model: string;
  private _firmware_version: string | null;
  private _status: DeviceStatus;
  private _paired_equipment_id: number | null;
  private _last_seen_at: Date | null;
  private _connectivity: DeviceConnectivity;

  /**
   * Creates a new instance of the Device class.
   *
   * @param device - An object containing the properties of the device.
   */
  public constructor(device: {
    id: number;
    device_uid: string;
    board_model: string;
    firmware_version: string | null;
    status: DeviceStatus;
    paired_equipment_id: number | null;
    last_seen_at: Date | null;
    connectivity: DeviceConnectivity;
  }) {
    this._id = device.id;
    this._device_uid = device.device_uid;
    this._board_model = device.board_model;
    this._firmware_version = device.firmware_version;
    this._status = device.status;
    this._paired_equipment_id = device.paired_equipment_id;
    this._last_seen_at = device.last_seen_at;
    this._connectivity = device.connectivity;
  }

  get id(): number {
    return this._id;
  }
  get device_uid(): string {
    return this._device_uid;
  }
  get board_model(): string {
    return this._board_model;
  }
  get firmware_version(): string | null {
    return this._firmware_version;
  }
  get status(): DeviceStatus {
    return this._status;
  }
  get paired_equipment_id(): number | null {
    return this._paired_equipment_id;
  }
  get last_seen_at(): Date | null {
    return this._last_seen_at;
  }
  get connectivity(): DeviceConnectivity {
    return this._connectivity;
  }

  /**
   * Whether the device's API key can be revoked: only a PAIRED device has a key in use.
   * @returns True when the device is PAIRED.
   */
  canBeRevoked(): boolean {
    return this._status === DeviceStatus.PAIRED;
  }

  /**
   * Whether a new API key can be issued: rotating replaces the key of a PAIRED device and is the way a
   * REVOKED device resumes.
   * @returns True when the device is PAIRED or REVOKED.
   */
  canRotateApiKey(): boolean {
    return this._status === DeviceStatus.PAIRED || this._status === DeviceStatus.REVOKED;
  }

  /**
   * Whether the device can be unlinked from its equipment.
   * @returns True when the device is PAIRED or REVOKED.
   */
  canBeUnpaired(): boolean {
    return this._status === DeviceStatus.PAIRED || this._status === DeviceStatus.REVOKED;
  }
}
