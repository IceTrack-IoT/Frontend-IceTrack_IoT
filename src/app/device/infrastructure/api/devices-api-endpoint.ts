import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { sendIdempotent } from '@shared/infrastructure/http/write-preconditions';
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

  /**
   * `GET /devices`: every device linked to the owner's units, as a plain array (no paging is sent).
   */
  listDevices(): Observable<DeviceResource[]> {
    return this.http.get<DeviceResource[]>(this.devicesUrl);
  }

  /**
   * `POST /devices`, with an `Idempotency-Key` so a retry never pairs twice. A replayed answer carries no
   * `api_key`.
   */
  registerDevice(request: RegisterDeviceRequest): Observable<DeviceCredentialResource> {
    return sendIdempotent((headers) =>
      this.http.post<DeviceCredentialResource>(this.devicesUrl, request, { headers }),
    );
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
