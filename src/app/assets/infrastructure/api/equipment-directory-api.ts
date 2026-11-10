import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ConditionalRead } from '@shared/infrastructure/http/conditional-read';
import type { EquipmentDirectoryEntry } from '@assets/application/contracts/equipment-directory-entry';
import type { EquipmentDirectoryPort } from '@assets/application/ports/equipment-directory.port';
import { AssetsAssembler } from '@assets/infrastructure/api/assets-assembler';
import { mapAssetsErrors } from '@assets/infrastructure/api/assets-error-mapping';
import type { EquipmentDirectoryEntryResource } from '@assets/infrastructure/api/equipment.response';

/**
 * EquipmentDirectoryApi implements the EquipmentDirectoryPort with `GET /assets/equipments/directory`,
 * which answers the identity of every unit of the authenticated owner, sorted by name and unpaged. The
 * last answer is revalidated with its ETag, so an unchanged directory answers `304` without a body.
 */
@Injectable({
  providedIn: 'root',
})
export class EquipmentDirectoryApi implements EquipmentDirectoryPort {
  private readonly read = new ConditionalRead<EquipmentDirectoryEntryResource[]>(
    inject(HttpClient),
  );
  private readonly assembler = new AssetsAssembler();
  private readonly directoryUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderEquipmentDirectoryEndpointPath}`;

  listEquipment(): Observable<EquipmentDirectoryEntry[]> {
    return this.read.get(this.directoryUrl, new HttpParams()).pipe(
      mapAssetsErrors(),
      map((resources) =>
        resources.map((resource) => this.assembler.toDirectoryEntryFromResource(resource)),
      ),
    );
  }
}
