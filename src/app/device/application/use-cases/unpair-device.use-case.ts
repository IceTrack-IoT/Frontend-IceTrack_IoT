import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { Device } from '@device/domain/model/device.entity';
import { DeviceError } from '@device/application/contracts/device-error';
import { DevicesPort } from '@device/application/ports/devices.port';

/**
 * Unlinks a PAIRED or REVOKED device from its equipment. Its API key stops working at once; the board and
 * the equipment can both be paired again.
 */
@Injectable({
  providedIn: 'root',
})
export class UnpairDeviceUseCase {
  private readonly devices = inject(DevicesPort);

  /**
   * @param device - The device to unpair.
   * @returns An Observable of the UNPAIRED device, as the backend recorded it.
   */
  execute(device: Device): Observable<Device> {
    if (!device.canBeUnpaired()) {
      return throwError(
        () =>
          new DeviceError(
            'INVALID_STATUS_TRANSITION',
            'Only a PAIRED or REVOKED device can be unpaired.',
          ),
      );
    }
    return this.devices.unpairDevice(device.id);
  }
}
