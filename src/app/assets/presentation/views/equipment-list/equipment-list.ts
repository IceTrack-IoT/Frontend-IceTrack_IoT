import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, map } from 'rxjs';
import { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import type { NewEquipment } from '@assets/application/contracts/equipment-registration';
import { AssetsStore, type EquipmentFilters } from '@assets/application/assets-store';
import {
  EQUIPMENT_ACTION_SUCCESS_KEYS,
  equipmentActionErrorKey,
} from '@assets/presentation/assets-feedback';
import { EquipmentFormDialog } from '@assets/presentation/components/equipment-form-dialog/equipment-form-dialog';
import {
  connectivityAppearanceOf,
  STATUS_EQUIPMENT_APPEARANCE,
} from '@assets/presentation/equipment-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/** How long the filters wait for the owner to stop typing before the list is reloaded. */
const FILTER_DEBOUNCE_MS = 300;

/** The asynchronous states of the equipment table while it is not populated. */
type ListStatus = 'loading' | 'error' | 'ready';

/**
 * Refrigeration equipment of the owner, filtered by site, type, status and a name or code search, and
 * paged by the backend. The `siteId` query parameter preselects a site. The owner registers equipment from
 * here.
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
    EquipmentFormDialog,
    RelativeTimePipe,
    TemperaturePipe,
  ],
  selector: 'app-equipment-list',
  styleUrl: './equipment-list.css',
  templateUrl: './equipment-list.html',
})
export class EquipmentList {
  protected readonly store = inject(AssetsStore);
  protected readonly types = Object.values(EquipmentType);
  protected readonly statuses = Object.values(StatusEquipment);
  protected readonly statusAppearance = STATUS_EQUIPMENT_APPEARANCE;
  protected readonly connectivityOf = connectivityAppearanceOf;

  protected readonly filters = inject(NonNullableFormBuilder).group({
    search: [''],
    siteId: ['ALL' as number | 'ALL'],
    type: ['ALL' as EquipmentType | 'ALL'],
    status: ['ALL' as StatusEquipment | 'ALL'],
  });

  /** Whether the registration dialog is open. */
  protected readonly registering = signal(false);

  protected readonly items = computed(() => this.store.equipmentPage()?.items ?? []);
  protected readonly total = computed(() => this.store.equipmentPage()?.totalElements ?? 0);
  protected readonly page = computed(() => this.store.equipmentQuery().page + 1);
  protected readonly pageCount = computed(() =>
    Math.max(1, this.store.equipmentPage()?.totalPages ?? 1),
  );
  protected readonly status = computed<ListStatus>(() => {
    if (this.store.equipmentPageLoading()) {
      return 'loading';
    }
    if (this.store.equipmentPageFailure() !== null) {
      return 'error';
    }
    return this.store.equipmentPage() === null ? 'loading' : 'ready';
  });
  /** The confirmation of the last registration, announced once its dialog is closed. */
  protected readonly announcement = computed(() => {
    const state = this.store.equipmentActionState();
    return !this.registering() && state?.status === 'succeeded'
      ? EQUIPMENT_ACTION_SUCCESS_KEYS[state.action]
      : null;
  });
  protected readonly dialogErrorKey = computed(() => {
    const state = this.store.equipmentActionState();
    return state?.status === 'failed' && state.failure !== null
      ? equipmentActionErrorKey(state.action, state.failure)
      : null;
  });

  constructor() {
    const siteId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('siteId'));
    if (Number.isInteger(siteId) && siteId > 0) {
      this.filters.controls.siteId.setValue(siteId);
    }
    this.store.clearEquipmentActionState();
    this.store.loadSites();
    this.store.loadEquipmentPage({ ...this.toQueryFilters(), page: 0 });

    this.filters.valueChanges
      .pipe(
        debounceTime(FILTER_DEBOUNCE_MS),
        map(() => this.toQueryFilters()),
        takeUntilDestroyed(),
      )
      .subscribe((filters) => this.store.loadEquipmentPage(filters));

    // A successful registration closes its dialog.
    effect(() => {
      if (this.store.equipmentActionState()?.status === 'succeeded') {
        untracked(() => this.registering.set(false));
      }
    });
  }

  protected reload(): void {
    this.store.loadEquipmentPage();
  }

  protected setPage(page: number): void {
    this.store.loadEquipmentPage({ page: page - 1 });
  }

  protected clearFilters(): void {
    this.filters.reset();
  }

  protected openRegistration(): void {
    this.store.clearEquipmentActionState();
    this.registering.set(true);
  }

  protected closeRegistration(): void {
    this.registering.set(false);
    if (this.store.equipmentActionState()?.status !== 'succeeded') {
      this.store.clearEquipmentActionState();
    }
  }

  protected register(equipment: NewEquipment): void {
    this.store.registerEquipment(equipment);
  }

  /** The site preselected in the filters, offered as the site of a new item. */
  protected preselectedSiteId(): number | null {
    const siteId = this.filters.controls.siteId.value;
    return siteId === 'ALL' ? null : siteId;
  }

  private toQueryFilters(): EquipmentFilters {
    const { search, siteId, type, status } = this.filters.getRawValue();
    return {
      search,
      siteId: siteId === 'ALL' ? null : siteId,
      type: type === 'ALL' ? null : type,
      status: status === 'ALL' ? null : status,
    };
  }
}
