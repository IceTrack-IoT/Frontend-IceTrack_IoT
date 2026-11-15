import { type HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ifMatchHeaders, sendIdempotent } from '@shared/infrastructure/http/write-preconditions';
import type {
  ChangeStatusRequest,
  ChangeThresholdRequest,
  RegisterEquipmentRequest,
  RegisterSiteRequest,
  UpdateEquipmentRequest,
  UpdateSiteAddressRequest,
  UpdateSiteRequest,
  ValidateAddressRequest,
} from '@assets/infrastructure/api/assets.requests';
import type {
  EquipmentResource,
  PagedEquipmentResource,
} from '@assets/infrastructure/api/equipment.response';
import type {
  AddressValidationResource,
  SiteResource,
} from '@assets/infrastructure/api/site.response';

const baseUrl = environment.iceTrackProviderApiBaseUrl;

/** The equipment list filters and paging, as query parameter values. */
export interface EquipmentListParams {
  search: string;
  status: string | null;
  equipmentType: string | null;
  siteId: number | null;
  page: number;
  size: number;
}

/**
 * AssetsApiEndpoint sends the owner requests of the `SiteController` and `EquipmentController`.
 */
export class AssetsApiEndpoint {
  private readonly sitesUrl = `${baseUrl}${environment.iceTrackProviderSitesEndpointPath}`;
  private readonly validateAddressUrl = `${baseUrl}${environment.iceTrackProviderValidateSiteAddressEndpointPath}`;
  private readonly siteByIdUrl = `${baseUrl}${environment.iceTrackProviderSiteByIdEndpointPath}`;
  private readonly siteAddressUrl = `${baseUrl}${environment.iceTrackProviderSiteAddressEndpointPath}`;
  private readonly siteGeocodingRetryUrl = `${baseUrl}${environment.iceTrackProviderSiteGeocodingRetryEndpointPath}`;
  private readonly equipmentUrl = `${baseUrl}${environment.iceTrackProviderEquipmentEndpointPath}`;
  private readonly equipmentByIdUrl = `${baseUrl}${environment.iceTrackProviderEquipmentByIdEndpointPath}`;
  private readonly thresholdUrl = `${baseUrl}${environment.iceTrackProviderEquipmentThresholdEndpointPath}`;
  private readonly statusUrl = `${baseUrl}${environment.iceTrackProviderEquipmentStatusEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `POST /assets/sites/validate-address` */
  validateAddress(request: ValidateAddressRequest): Observable<AddressValidationResource> {
    return this.http.post<AddressValidationResource>(this.validateAddressUrl, request);
  }

  /** `POST /assets/sites`, with an `Idempotency-Key` so a retry never registers the site twice. */
  registerSite(request: RegisterSiteRequest): Observable<SiteResource> {
    return sendIdempotent((headers) =>
      this.http.post<SiteResource>(this.sitesUrl, request, { headers }),
    );
  }

  /** `GET /assets/sites` */
  listSites(): Observable<SiteResource[]> {
    return this.http.get<SiteResource[]>(this.sitesUrl);
  }

  /** `PUT /assets/sites/{siteId}` with `If-Match` */
  updateSite(
    siteId: number,
    version: number,
    request: UpdateSiteRequest,
  ): Observable<SiteResource> {
    return this.http.put<SiteResource>(withId(this.siteByIdUrl, '{siteId}', siteId), request, {
      headers: ifMatchHeaders(version),
    });
  }

  /** `PUT /assets/sites/{siteId}/address` with `If-Match` */
  updateSiteAddress(
    siteId: number,
    version: number,
    request: UpdateSiteAddressRequest,
  ): Observable<SiteResource> {
    return this.http.put<SiteResource>(withId(this.siteAddressUrl, '{siteId}', siteId), request, {
      headers: ifMatchHeaders(version),
    });
  }

  /**
   * `POST /assets/sites/{siteId}/geocoding/retry`, without a body. It answers 200 when the lookup finished
   * and 202 with the site `PENDING` when it continues in the background; both carry the site.
   */
  retrySiteGeocoding(siteId: number): Observable<SiteResource> {
    return this.http.post<SiteResource>(
      withId(this.siteGeocodingRetryUrl, '{siteId}', siteId),
      null,
    );
  }

  /** `POST /assets/equipments`, with an `Idempotency-Key` so a retry never registers the unit twice. */
  registerEquipment(request: RegisterEquipmentRequest): Observable<EquipmentResource> {
    return sendIdempotent((headers) =>
      this.http.post<EquipmentResource>(this.equipmentUrl, request, { headers }),
    );
  }

  /**
   * `GET /assets/equipments?search&status&equipment_type&site_id&page&size`. Both `page` and `size` are
   * always sent, so the backend answers the paged wrapper.
   */
  listEquipment(params: EquipmentListParams): Observable<PagedEquipmentResource> {
    let query = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.search !== '') {
      query = query.set('search', params.search);
    }
    if (params.status !== null) {
      query = query.set('status', params.status);
    }
    if (params.equipmentType !== null) {
      query = query.set('equipment_type', params.equipmentType);
    }
    if (params.siteId !== null) {
      query = query.set('site_id', params.siteId);
    }
    return this.http.get<PagedEquipmentResource>(this.equipmentUrl, { params: query });
  }

  /** `GET /assets/equipments/{equipmentId}` */
  getEquipment(equipmentId: number): Observable<EquipmentResource> {
    return this.http.get<EquipmentResource>(
      withId(this.equipmentByIdUrl, '{equipmentId}', equipmentId),
    );
  }

  /** `PUT /assets/equipments/{equipmentId}` with `If-Match` */
  updateEquipment(
    equipmentId: number,
    version: number,
    request: UpdateEquipmentRequest,
  ): Observable<EquipmentResource> {
    return this.http.put<EquipmentResource>(
      withId(this.equipmentByIdUrl, '{equipmentId}', equipmentId),
      request,
      { headers: ifMatchHeaders(version) },
    );
  }

  /** `PUT /assets/equipments/{equipmentId}/threshold` with `If-Match` */
  changeThreshold(
    equipmentId: number,
    version: number,
    request: ChangeThresholdRequest,
  ): Observable<EquipmentResource> {
    return this.http.put<EquipmentResource>(
      withId(this.thresholdUrl, '{equipmentId}', equipmentId),
      request,
      { headers: ifMatchHeaders(version) },
    );
  }

  /** `PUT /assets/equipments/{equipmentId}/status` with `If-Match` */
  changeStatus(
    equipmentId: number,
    version: number,
    request: ChangeStatusRequest,
  ): Observable<EquipmentResource> {
    return this.http.put<EquipmentResource>(
      withId(this.statusUrl, '{equipmentId}', equipmentId),
      request,
      { headers: ifMatchHeaders(version) },
    );
  }
}

function withId(url: string, placeholder: string, id: number): string {
  return url.replace(placeholder, encodeURIComponent(String(id)));
}
