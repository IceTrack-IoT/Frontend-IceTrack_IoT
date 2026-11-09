import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { Device } from '@device/domain/model/device.entity';
import type { DeviceStatus } from '@device/domain/value-objects/device-status';
import type {
  DevicePairing,
  IssuedDeviceCredential,
} from '@device/application/contracts/device-pairing';
import type { DevicesPort } from '@device/application/ports/devices.port';
import { DeviceAssembler } from '@device/infrastructure/api/device-assembler';
import { mapDeviceErrors } from '@device/infrastructure/api/device-error-mapping';
import { DevicesApiEndpoint } from '@device/infrastructure/api/devices-api-endpoint';

/**
 * DevicesApi implements the DevicesPort against the owner endpoints of Device Management. Issued API keys
 * are handed to the caller as they arrive and are never logged or stored here.
 */
@Injectable({
  providedIn: 'root',
})
export class DevicesApi extends BaseApi implements DevicesPort {
  private readonly endpoint = new DevicesApiEndpoint(inject(HttpClient));
  private readonly assembler = new DeviceAssembler();

  listDevicesByEquipment(equipmentId: number): Observable<Device[]> {
    return this.endpoint.listDevicesByEquipment(equipmentId).pipe(
      mapDeviceErrors(),
      map((resources) =>
        resources.map((resource) => this.assembler.toDeviceFromResource(resource)),
      ),
    );
  }

  pairDevice(pairing: DevicePairing): Observable<IssuedDeviceCredential> {
    return this.endpoint.registerDevice(this.assembler.toRegisterDeviceRequest(pairing)).pipe(
      mapDeviceErrors(),
      map((resource) => this.assembler.toIssuedCredentialFromResource(resource)),
    );
  }

  unpairDevice(deviceId: number): Observable<Device> {
    return this.endpoint.unpairDevice(deviceId).pipe(
      mapDeviceErrors(),
      map((resource) => this.assembler.toDeviceFromResource(resource)),
    );
  }

  rotateApiKey(deviceId: number): Observable<IssuedDeviceCredential> {
    return this.endpoint.rotateApiKey(deviceId).pipe(
      mapDeviceErrors(),
      map((resource) => this.assembler.toIssuedCredentialFromResource(resource)),
    );
  }

  changeStatus(deviceId: number, status: DeviceStatus): Observable<Device> {
    return this.endpoint
      .changeStatus(deviceId, this.assembler.toChangeDeviceStatusRequest(status))
      .pipe(
        mapDeviceErrors(),
        map((resource) => this.assembler.toDeviceFromResource(resource)),
      );
  }
}
