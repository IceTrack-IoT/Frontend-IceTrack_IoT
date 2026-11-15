import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ifMatchHeaders } from '@shared/infrastructure/http/write-preconditions';
import type { CreateDashboardConfigRequest } from '@profiles/infrastructure/api/create-dashboard-config.request';
import type { DashboardConfigResponse } from '@profiles/infrastructure/api/dashboard-config.response';
import type { UpdateDashboardDefaultsRequest } from '@profiles/infrastructure/api/update-dashboard-defaults.request';
import type { UpdateDashboardLayoutRequest } from '@profiles/infrastructure/api/update-dashboard-layout.request';

/**
 * DashboardConfigApiEndpoint sends the requests of the `DashboardConfigsController`. Every endpoint only
 * accepts the caller's own account.
 */
export class DashboardConfigApiEndpoint {
  private readonly baseUrl = environment.iceTrackProviderApiBaseUrl;
  private readonly createEndpointUrl = `${this.baseUrl}${environment.iceTrackProviderCreateDashboardConfigEndpointPath}`;
  private readonly byUserIdEndpointUrl = `${this.baseUrl}${environment.iceTrackProviderGetDashboardConfigByUserIdEndpointPath}`;
  private readonly layoutEndpointUrl = `${this.baseUrl}${environment.iceTrackProviderUpdateDashboardLayoutEndpointPath}`;
  private readonly defaultsEndpointUrl = `${this.baseUrl}${environment.iceTrackProviderUpdateDashboardDefaultsEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves the dashboard configuration of an account
   * (`GET /profiles/dashboard-configs/user/{userId}`).
   * @param userId - The caller's own platform account id.
   * @returns An Observable of the DashboardConfigResponse.
   */
  getByUserId(userId: number): Observable<DashboardConfigResponse> {
    return this.http.get<DashboardConfigResponse>(
      this.withUserId(this.byUserIdEndpointUrl, userId),
    );
  }

  /**
   * Creates the dashboard configuration of an account (`POST /profiles/dashboard-configs`), which answers
   * 201.
   * @param request - The CreateDashboardConfigRequest.
   * @returns An Observable of the created DashboardConfigResponse.
   */
  create(request: CreateDashboardConfigRequest): Observable<DashboardConfigResponse> {
    return this.http.post<DashboardConfigResponse>(this.createEndpointUrl, request);
  }

  /**
   * Replaces the layout of the dashboard of an account
   * (`PUT /profiles/dashboard-configs/user/{userId}/layout`), only when the configuration is still at the
   * given version (`If-Match`).
   * @param userId - The caller's own platform account id.
   * @param version - The version of the configuration the change was made from.
   * @param request - The UpdateDashboardLayoutRequest.
   * @returns An Observable of the updated DashboardConfigResponse.
   */
  updateLayout(
    userId: number,
    version: number,
    request: UpdateDashboardLayoutRequest,
  ): Observable<DashboardConfigResponse> {
    return this.http.put<DashboardConfigResponse>(
      this.withUserId(this.layoutEndpointUrl, userId),
      request,
      { headers: ifMatchHeaders(version) },
    );
  }

  /**
   * Replaces the defaults of the dashboard of an account
   * (`PUT /profiles/dashboard-configs/user/{userId}/defaults`), only when the configuration is still at
   * the given version (`If-Match`).
   * @param userId - The caller's own platform account id.
   * @param version - The version of the configuration the change was made from.
   * @param request - The UpdateDashboardDefaultsRequest.
   * @returns An Observable of the updated DashboardConfigResponse.
   */
  updateDefaults(
    userId: number,
    version: number,
    request: UpdateDashboardDefaultsRequest,
  ): Observable<DashboardConfigResponse> {
    return this.http.put<DashboardConfigResponse>(
      this.withUserId(this.defaultsEndpointUrl, userId),
      request,
      { headers: ifMatchHeaders(version) },
    );
  }

  private withUserId(url: string, userId: number): string {
    return url.replace('{userId}', String(userId));
  }
}
