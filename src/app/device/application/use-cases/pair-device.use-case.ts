import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  DevicePairing,
  IssuedDeviceCredential,
} from '@device/application/contracts/device-pairing';
import { DevicesPort } from '@device/application/ports/devices.port';

/**
 * Pairs a board with one of the owner's equipment items. The backend issues the device's API key in the
 * answer, the only time it is ever returned.
 */
@Injectable({
  providedIn: 'root',
})
export class PairDeviceUseCase {
  private readonly devices = inject(DevicesPort);

  /**
   * @param pairing - The equipment and the board.
   * @returns An Observable of the PAIRED device with its API key.
   */
  execute(pairing: DevicePairing): Observable<IssuedDeviceCredential> {
    const firmwareVersion = pairing.firmwareVersion?.trim() ?? '';
    return this.devices.pairDevice({
      equipmentId: pairing.equipmentId,
      deviceUid: pairing.deviceUid.trim(),
      boardModel: pairing.boardModel.trim(),
      firmwareVersion: firmwareVersion === '' ? null : firmwareVersion,
    });
  }
}
