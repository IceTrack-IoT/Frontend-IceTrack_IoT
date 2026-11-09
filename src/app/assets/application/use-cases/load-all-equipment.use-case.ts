import { inject, Injectable } from '@angular/core';
import { EMPTY, expand, type Observable, reduce } from 'rxjs';
import type { Equipment } from '@assets/domain/model/equipment.entity';
import { LoadEquipmentPageUseCase } from '@assets/application/use-cases/load-equipment-page.use-case';

/** The largest page the equipment list accepts. */
const PAGE_SIZE = 100;

/**
 * Loads every equipment item of the owner, unfiltered, by reading the equipment list page by page. Used by
 * the facades through which other bounded contexts read the owner's equipment.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadAllEquipmentUseCase {
  private readonly loadEquipmentPageUseCase = inject(LoadEquipmentPageUseCase);

  /**
   * @returns An Observable of all the owner's equipment.
   */
  execute(): Observable<Equipment[]> {
    const pageOf = (page: number) =>
      this.loadEquipmentPageUseCase.execute({
        search: '',
        status: null,
        type: null,
        siteId: null,
        page,
        size: PAGE_SIZE,
      });
    return pageOf(0).pipe(
      expand((page) => (page.page + 1 < page.totalPages ? pageOf(page.page + 1) : EMPTY)),
      reduce((equipment: Equipment[], page) => equipment.concat(page.items), []),
    );
  }
}
