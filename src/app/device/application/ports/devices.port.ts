import type { Observable } from 'rxjs';
import type { Device } from '@device/domain/model/device.entity';
import type { DeviceStatus } from '@device/domain/value-objects/device-status';
import type {
  DevicePairing,
  IssuedDeviceCredential,
} from '@device/application/contracts/device-pairing';

/**
 * DevicesPort is the outbound port used by Device Management use cases to read the owner's devices and run
 * their lifecycle actions on the backend. Every action answers the device as the backend recorded it; the
 * backend scopes every request to the signed-in owner.
 *
 * Definitive backend rejections are reported as DeviceError; any other error is transient. Declared as an
 * abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class DevicesPort {
  /**
   * Lists every device linked (PAIRED or REVOKED) to the owner's equipment, in one read. Unpaired boards
   * belong to no owner, so they are never listed.
   * @returns An Observable of the devices, ordered by board UID.
   */
  abstract listDevices(): Observable<Device[]>;

  /**
   * Pairs a board with one of the owner's equipment items and issues its API key. A pairing whose outcome
   * is unknown is retried without pairing twice; when the answer is replayed, the key is not returned.
   * Fails with `VALIDATION_ERROR`, `NOT_FOUND` (the equipment is missing or not the owner's),
   * `DEVICE_CONFLICT` (the board is already paired, or the equipment already has a paired device) or
   * `IDEMPOTENCY_KEY_CONFLICT` (the same pairing is still being processed).
   * @param pairing - The equipment and the board.
   * @returns An Observable of the paired device with its API key, or with a null key when replayed.
   */
  abstract pairDevice(pairing: DevicePairing): Observable<IssuedDeviceCredential>;

  /**
   * Unlinks a PAIRED or REVOKED device from its equipment and invalidates its API key.
   * Fails with `NOT_FOUND`.
   * @param deviceId - The identifier of the device.
   * @returns An Observable of the unpaired device.
   */
  abstract unpairDevice(deviceId: number): Observable<Device>;

  /**
   * Issues a new API key and invalidates the previous one; a REVOKED device becomes PAIRED again.
   * Fails with `NOT_FOUND`.
   * @param deviceId - The identifier of the device.
   * @returns An Observable of the device with its new API key.
   */
  abstract rotateApiKey(deviceId: number): Observable<IssuedDeviceCredential>;

  /**
   * Moves a device to another lifecycle status.
   * Fails with `VALIDATION_ERROR`, `NOT_FOUND` or a conflict when the transition is not allowed.
   * @param deviceId - The identifier of the device.
   * @param status - The status to move the device to.
   * @returns An Observable of the device in its new status.
   */
  abstract changeStatus(deviceId: number, status: DeviceStatus): Observable<Device>;
}
