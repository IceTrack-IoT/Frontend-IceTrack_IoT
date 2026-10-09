import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { Equipment } from '@assets/domain/model/equipment.entity';
import { Site } from '@assets/domain/model/site.entity';
import { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import { STATUS_EQUIPMENT_APPEARANCE } from '@assets/presentation/equipment-appearance';
import { createEquipmentMock, createSitesMock } from '@assets/presentation/mocks/assets.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import {
  pageCountOf,
  pageOf,
  Pagination,
} from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

const PAGE_SIZE = 8;

/**
 * Refrigeration equipment of the owner, filtered by site, type, status and a name or code search. The
 * `siteId` query parameter preselects a site.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Icon,
    Pagination,
    StatePanel,
    StatusTag,
    RelativeTimePipe,
    TemperaturePipe,
  ],
  selector: 'app-equipment-list',
  styleUrl: './equipment-list.css',
  templateUrl: './equipment-list.html',
})
export class EquipmentList {
  protected readonly source = injectMockDataSource();
  protected readonly types = Object.values(EquipmentType);
  protected readonly statuses = Object.values(StatusEquipment);
  protected readonly statusAppearance = STATUS_EQUIPMENT_APPEARANCE;

  protected readonly filters = inject(NonNullableFormBuilder).group({
    search: [''],
    siteId: ['ALL' as number | 'ALL'],
    type: ['ALL' as EquipmentType | 'ALL'],
    status: ['ALL' as StatusEquipment | 'ALL'],
  });
  private readonly filterValue = toSignal(
    this.filters.valueChanges.pipe(map(() => this.filters.getRawValue())),
    { initialValue: this.filters.getRawValue() },
  );

  protected readonly sites = signal<Site[]>([]);
  private readonly equipment = signal<Equipment[]>([]);
  protected readonly page = signal(1);

  protected readonly siteNames = computed(
    () => new Map(this.sites().map((site) => [site.id, site.name])),
  );
  protected readonly filtered = computed(() => {
    const { search, siteId, type, status } = this.filterValue();
    const term = search.trim().toLowerCase();
    return this.equipment().filter(
      (item) =>
        (siteId === 'ALL' || item.site_id === siteId) &&
        (type === 'ALL' || item.equipment_type === type) &&
        (status === 'ALL' || item.status === status) &&
        (term === '' ||
          item.name.toLowerCase().includes(term) ||
          item.equipment_code_uid.toLowerCase().includes(term)),
    );
  });
  protected readonly total = computed(() => this.equipment().length);
  protected readonly pageCount = computed(() => pageCountOf(this.filtered().length, PAGE_SIZE));
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  constructor() {
    const siteId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('siteId'));
    if (Number.isInteger(siteId) && siteId > 0) {
      this.filters.controls.siteId.setValue(siteId);
    }
    this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.page.set(1));
    this.load();
  }

  protected load(): void {
    this.source.load((empty) => {
      this.sites.set(createSitesMock());
      this.equipment.set(empty ? [] : createEquipmentMock());
    });
  }

  protected clearFilters(): void {
    this.filters.reset();
  }

  /** The first block of the equipment code, enough to tell items apart in the table. */
  protected shortCode(item: Equipment): string {
    return item.equipment_code_uid.split('-')[0].toUpperCase();
  }
}
