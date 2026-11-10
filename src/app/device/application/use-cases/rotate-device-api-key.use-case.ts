import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Device } from '@device/domain/model/device.entity';
import { DeviceError } from '@device/application/contracts/device-error';
import type { IssuedDeviceCredential } from '@device/application/contracts/device-pairing';
import { DevicesPort } from '@device/application/ports/devices.port';

/**
 * Issues a new API key for a PAIRED or REVOKED device and invalidates the previous one. A REVOKED device
 * becomes PAIRED again. The new key is returned only in this answer.
 */
@Injectable({
  providedIn: 'root',
})
export class RotateDeviceApiKeyUseCase {
  private readonly devices = inject(DevicesPort);

  /**
   * @param device - The device whose key is rotated.
   * @returns An Observable of the PAIRED device with its new API key.
   */
  execute(device: Device): Observable<IssuedDeviceCredential> {
    if (!device.canRotateApiKey()) {
      return throwError(
        () =>
          new DeviceError(
            'INVALID_STATUS_TRANSITION',
            'Only a PAIRED or REVOKED device can receive a new API key.',
          ),
      );
    }
    return this.devices.rotateApiKey(device.id);
  }
}
