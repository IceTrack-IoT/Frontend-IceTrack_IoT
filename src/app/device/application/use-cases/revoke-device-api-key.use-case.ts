import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Device } from '@device/domain/model/device.entity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';
import { DeviceError } from '@device/application/contracts/device-error';
import { DevicesPort } from '@device/application/ports/devices.port';

/**
 * Revokes the API key of a PAIRED device: the key stops working at once while the device stays linked to
 * its equipment. Rotating the key afterwards is the way the device resumes.
 */
@Injectable({
  providedIn: 'root',
})
export class RevokeDeviceApiKeyUseCase {
  private readonly devices = inject(DevicesPort);

  /**
   * @param device - The device whose key is revoked.
   * @returns An Observable of the REVOKED device, as the backend recorded it.
   */
  execute(device: Device): Observable<Device> {
    if (!device.canBeRevoked()) {
      return throwError(
        () =>
          new DeviceError(
            'INVALID_STATUS_TRANSITION',
            'Only the API key of a PAIRED device can be revoked.',
          ),
      );
    }
    return this.devices.changeStatus(device.id, DeviceStatus.REVOKED);
  }
}
