import { type HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment';
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
  private readonly equipmentUrl = `${baseUrl}${environment.iceTrackProviderEquipmentEndpointPath}`;
  private readonly equipmentByIdUrl = `${baseUrl}${environment.iceTrackProviderEquipmentByIdEndpointPath}`;
  private readonly thresholdUrl = `${baseUrl}${environment.iceTrackProviderEquipmentThresholdEndpointPath}`;
  private readonly statusUrl = `${baseUrl}${environment.iceTrackProviderEquipmentStatusEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /** `POST /assets/sites/validate-address` */
  validateAddress(request: ValidateAddressRequest): Observable<AddressValidationResource> {
    return this.http.post<AddressValidationResource>(this.validateAddressUrl, request);
  }

  /** `POST /assets/sites` */
  registerSite(request: RegisterSiteRequest): Observable<SiteResource> {
    return this.http.post<SiteResource>(this.sitesUrl, request);
  }

  /** `GET /assets/sites` */
  listSites(): Observable<SiteResource[]> {
    return this.http.get<SiteResource[]>(this.sitesUrl);
  }

  /** `PUT /assets/sites/{siteId}` */
  updateSite(siteId: number, request: UpdateSiteRequest): Observable<SiteResource> {
    return this.http.put<SiteResource>(withId(this.siteByIdUrl, '{siteId}', siteId), request);
  }

  /** `PUT /assets/sites/{siteId}/address` */
  updateSiteAddress(siteId: number, request: UpdateSiteAddressRequest): Observable<SiteResource> {
    return this.http.put<SiteResource>(withId(this.siteAddressUrl, '{siteId}', siteId), request);
  }

  /** `POST /assets/equipments` */
  registerEquipment(request: RegisterEquipmentRequest): Observable<EquipmentResource> {
    return this.http.post<EquipmentResource>(this.equipmentUrl, request);
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

  /** `PUT /assets/equipments/{equipmentId}` */
  updateEquipment(
    equipmentId: number,
    request: UpdateEquipmentRequest,
  ): Observable<EquipmentResource> {
    return this.http.put<EquipmentResource>(
      withId(this.equipmentByIdUrl, '{equipmentId}', equipmentId),
      request,
    );
  }

  /** `PUT /assets/equipments/{equipmentId}/threshold` */
  changeThreshold(
    equipmentId: number,
    request: ChangeThresholdRequest,
  ): Observable<EquipmentResource> {
    return this.http.put<EquipmentResource>(
      withId(this.thresholdUrl, '{equipmentId}', equipmentId),
      request,
    );
  }

  /** `PUT /assets/equipments/{equipmentId}/status` */
  changeStatus(equipmentId: number, request: ChangeStatusRequest): Observable<EquipmentResource> {
    return this.http.put<EquipmentResource>(
      withId(this.statusUrl, '{equipmentId}', equipmentId),
      request,
    );
  }
}

function withId(url: string, placeholder: string, id: number): string {
  return url.replace(placeholder, encodeURIComponent(String(id)));
}
