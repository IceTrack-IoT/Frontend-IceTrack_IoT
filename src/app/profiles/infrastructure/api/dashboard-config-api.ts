import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';
import type { DashboardCard } from '@profiles/domain/value-objects/dashboard-card';
import type { DashboardDefaults } from '@profiles/application/contracts/dashboard-config-change';
import type { DashboardConfigPort } from '@profiles/application/ports/dashboard-config.port';
import { DashboardConfigApiEndpoint } from '@profiles/infrastructure/api/dashboard-config-api-endpoint';
import { DashboardConfigAssembler } from '@profiles/infrastructure/api/dashboard-config-assembler';
import type { DashboardConfigResponse } from '@profiles/infrastructure/api/dashboard-config.response';
import { mapProfilesErrors } from '@profiles/infrastructure/api/profiles-error-mapping';

/**
 * DashboardConfigApi implements the DashboardConfigPort against the dashboard configuration endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardConfigApi extends BaseApi implements DashboardConfigPort {
  private readonly endpoint = new DashboardConfigApiEndpoint(inject(HttpClient));
  private readonly assembler = new DashboardConfigAssembler();

  getDashboardConfig(userId: number): Observable<DashboardConfig> {
    return this.toEntity(this.endpoint.getByUserId(userId));
  }

  createDashboardConfig(userId: number, defaults: DashboardDefaults): Observable<DashboardConfig> {
    return this.toEntity(this.endpoint.create(this.assembler.toCreateRequest(userId, defaults)));
  }

  updateDashboardLayout(
    userId: number,
    layout: readonly DashboardCard[],
  ): Observable<DashboardConfig> {
    return this.toEntity(
      this.endpoint.updateLayout(userId, this.assembler.toLayoutRequest(layout)),
    );
  }

  updateDashboardDefaults(
    userId: number,
    defaults: DashboardDefaults,
  ): Observable<DashboardConfig> {
    return this.toEntity(
      this.endpoint.updateDefaults(userId, this.assembler.toDefaultsRequest(defaults)),
    );
  }

  private toEntity(response: Observable<DashboardConfigResponse>): Observable<DashboardConfig> {
    return response.pipe(
      map((resource) => this.assembler.toEntityFromResponse(resource)),
      mapProfilesErrors(),
    );
  }
}
