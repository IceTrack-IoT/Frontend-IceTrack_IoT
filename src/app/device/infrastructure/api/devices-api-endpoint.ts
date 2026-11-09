import { type HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import type {
  ChangeDeviceStatusRequest,
  RegisterDeviceRequest,
} from '@device/infrastructure/api/device.requests';
import type {
  DeviceCredentialResource,
  DeviceResource,
} from '@device/infrastructure/api/device.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/**
 * DevicesApiEndpoint sends the owner requests of the `DeviceController`. The edge configuration route
 * (`GET /devices/me/config`) is authenticated by a device API key and is never called by the web
 * application.
 */
export class DevicesApiEndpoint {
  private readonly devicesUrl = `${baseUrl}${environment.iceTrackProviderDevicesEndpointPath}`;
  private readonly unpairUrl = `${baseUrl}${environment.iceTrackProviderUnpairDeviceEndpointPath}`;
  private readonly rotateApiKeyUrl = `${baseUrl}${environment.iceTrackProviderRotateDeviceApiKeyEndpointPath}`;
  private readonly statusUrl = `${baseUrl}${environment.iceTrackProviderDeviceStatusEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `GET /devices?equipment_id`: the devices linked to the unit. */
  listDevicesByEquipment(equipmentId: number): Observable<DeviceResource[]> {
    const params = new HttpParams().set('equipment_id', equipmentId);
    return this.http.get<DeviceResource[]>(this.devicesUrl, { params });
  }

  /** `POST /devices` */
  registerDevice(request: RegisterDeviceRequest): Observable<DeviceCredentialResource> {
    return this.http.post<DeviceCredentialResource>(this.devicesUrl, request);
  }

  /** `POST /devices/{deviceId}/unpair` (no body) */
  unpairDevice(deviceId: number): Observable<DeviceResource> {
    return this.http.post<DeviceResource>(withId(this.unpairUrl, deviceId), null);
  }

  /** `POST /devices/{deviceId}/rotate-api-key` (no body) */
  rotateApiKey(deviceId: number): Observable<DeviceCredentialResource> {
    return this.http.post<DeviceCredentialResource>(withId(this.rotateApiKeyUrl, deviceId), null);
  }

  /** `PUT /devices/{deviceId}/status` */
  changeStatus(deviceId: number, request: ChangeDeviceStatusRequest): Observable<DeviceResource> {
    return this.http.put<DeviceResource>(withId(this.statusUrl, deviceId), request);
  }
}

function withId(url: string, deviceId: number): string {
  return url.replace('{deviceId}', encodeURIComponent(String(deviceId)));
}
