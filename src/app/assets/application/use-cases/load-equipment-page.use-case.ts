import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { EquipmentPage, EquipmentQuery } from '@assets/application/contracts/equipment-page';
import { EquipmentPort } from '@assets/application/ports/equipment.port';

/**
 * Loads one page of the owner's equipment, filtered by search text, status, type and site.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadEquipmentPageUseCase {
  private readonly port = inject(EquipmentPort);

  /**
   * @param query - The filters and paging.
   * @returns An Observable of the page.
   */
  execute(query: EquipmentQuery): Observable<EquipmentPage> {
    return this.port.listEquipment({ ...query, search: query.search.trim() });
  }
}
