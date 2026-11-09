import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '@env/environment';
import type { EquipmentSummary } from '@assets/application/contracts/equipment-summary';
import type { EquipmentDirectoryPort } from '@assets/application/ports/equipment-directory.port';
import type { EquipmentResource } from '@assets/infrastructure/api/equipment.response';

/**
 * EquipmentDirectoryApi implements the EquipmentDirectoryPort with `GET /assets/equipments`, which lists
 * only the equipment of the authenticated owner. Without `page` and `size` it answers a plain array.
 */
@Injectable({
  providedIn: 'root',
})
export class EquipmentDirectoryApi implements EquipmentDirectoryPort {
  private readonly http = inject(HttpClient);
  private readonly equipmentEndpointUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderEquipmentEndpointPath}`;

  listEquipment(): Observable<EquipmentSummary[]> {
    return this.http
      .get<EquipmentResource[]>(this.equipmentEndpointUrl)
      .pipe(
        map((resources) =>
          resources.map(({ id, name, site_id }) => ({ id, name, siteId: site_id })),
        ),
      );
  }
}
