import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { BaseApi } from '@shared/infrastructure/api/base-api';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import type { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';
import type { EquipmentPage, EquipmentQuery } from '@assets/application/contracts/equipment-page';
import type {
  EquipmentChanges,
  NewEquipment,
} from '@assets/application/contracts/equipment-registration';
import type { EquipmentPort } from '@assets/application/ports/equipment.port';
import { AssetsApiEndpoint } from '@assets/infrastructure/api/assets-api-endpoint';
import { AssetsAssembler } from '@assets/infrastructure/api/assets-assembler';
import { mapAssetsErrors } from '@assets/infrastructure/api/assets-error-mapping';

/**
 * EquipmentApi implements the EquipmentPort against the owner equipment endpoints of Assets Management.
 */
@Injectable({
  providedIn: 'root',
})
export class EquipmentApi extends BaseApi implements EquipmentPort {
  private readonly endpoint = new AssetsApiEndpoint(inject(HttpClient));
  private readonly assembler = new AssetsAssembler();

  registerEquipment(equipment: NewEquipment): Observable<Equipment> {
    return this.endpoint
      .registerEquipment(this.assembler.toRegisterEquipmentRequest(equipment))
      .pipe(
        mapAssetsErrors(),
        map((resource) => this.assembler.toEquipmentFromResource(resource)),
      );
  }

  listEquipment(query: EquipmentQuery): Observable<EquipmentPage> {
    return this.endpoint
      .listEquipment({
        search: query.search,
        status: query.status,
        equipmentType: query.type,
        siteId: query.siteId,
        page: query.page,
        size: query.size,
      })
      .pipe(
        mapAssetsErrors(),
        map((resource) => this.assembler.toEquipmentPageFromResource(resource)),
      );
  }

  getEquipment(equipmentId: number): Observable<Equipment> {
    return this.endpoint.getEquipment(equipmentId).pipe(
      mapAssetsErrors(),
      map((resource) => this.assembler.toEquipmentFromResource(resource)),
    );
  }

  updateEquipment(
    equipmentId: number,
    version: number,
    changes: EquipmentChanges,
  ): Observable<Equipment> {
    return this.endpoint
      .updateEquipment(equipmentId, version, this.assembler.toUpdateEquipmentRequest(changes))
      .pipe(
        mapAssetsErrors(),
        map((resource) => this.assembler.toEquipmentFromResource(resource)),
      );
  }

  changeThreshold(
    equipmentId: number,
    version: number,
    threshold: TemperatureThreshold,
  ): Observable<Equipment> {
    return this.endpoint
      .changeThreshold(equipmentId, version, {
        min_celsius: threshold.min_celsius,
        max_celsius: threshold.max_celsius,
      })
      .pipe(
        mapAssetsErrors(),
        map((resource) => this.assembler.toEquipmentFromResource(resource)),
      );
  }

  changeStatus(
    equipmentId: number,
    version: number,
    status: StatusEquipment,
  ): Observable<Equipment> {
    return this.endpoint.changeStatus(equipmentId, version, { new_status: status }).pipe(
      mapAssetsErrors(),
      map((resource) => this.assembler.toEquipmentFromResource(resource)),
    );
  }
}
