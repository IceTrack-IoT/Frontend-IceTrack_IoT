import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';
import type { EquipmentChanges } from '@assets/application/contracts/equipment-registration';
import { AssetsStore } from '@assets/application/assets-store';
import {
  EQUIPMENT_ACTION_SUCCESS_KEYS,
  equipmentActionErrorKey,
} from '@assets/presentation/assets-feedback';
import { EquipmentFormDialog } from '@assets/presentation/components/equipment-form-dialog/equipment-form-dialog';
import { EquipmentStatusDialog } from '@assets/presentation/components/equipment-status-dialog/equipment-status-dialog';
import { EquipmentThresholdForm } from '@assets/presentation/components/equipment-threshold-form/equipment-threshold-form';
import { STATUS_EQUIPMENT_APPEARANCE } from '@assets/presentation/equipment-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/** The dialogs of the detail. */
type DetailDialog = 'edit' | 'status';

/** The asynchronous states of the detail. */
type DetailStatus = 'loading' | 'error' | 'not-found' | 'ready';

const isEquipmentId = (value: number): boolean => Number.isInteger(value) && value > 0;

/**
 * Detail of an equipment item: identity, lifecycle status, last known temperature, threshold and
 * maintenance interval. The owner edits the item, changes its threshold and moves it to another status
 * from here. Device, telemetry, alert and service information belong to other contexts, so the view links
 * to them by equipment identifier instead of composing their data.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    Icon,
    StatePanel,
    StatusTag,
    EquipmentFormDialog,
    EquipmentStatusDialog,
    EquipmentThresholdForm,
    LocalizedDatePipe,
    RelativeTimePipe,
    TemperaturePipe,
  ],
  selector: 'app-equipment-detail',
  styleUrl: './equipment-detail.css',
  templateUrl: './equipment-detail.html',
})
export class EquipmentDetail {
  protected readonly store = inject(AssetsStore);
  protected readonly statusAppearance = STATUS_EQUIPMENT_APPEARANCE;
  protected readonly dialog = signal<DetailDialog | null>(null);

  private readonly equipmentId = signal(0);

  /** The selected equipment, once it is the one of the route. */
  protected readonly equipment = computed(() => {
    const equipment = this.store.selectedEquipment();
    return equipment?.id === this.equipmentId() ? equipment : null;
  });
  protected readonly site = computed(() => {
    const equipment = this.equipment();
    return equipment === null ? null : (this.store.siteById().get(equipment.site_id) ?? null);
  });
  protected readonly status = computed<DetailStatus>(() => {
    if (this.equipment() !== null) {
      return 'ready';
    }
    if (!isEquipmentId(this.equipmentId())) {
      return 'not-found';
    }
    switch (this.store.selectedEquipmentFailure()) {
      case null:
        return 'loading';
      case 'NOT_FOUND':
        return 'not-found';
      default:
        return 'error';
    }
  });

  /** The confirmation of the last action, announced once its dialog is closed. */
  protected readonly announcement = computed(() => {
    const state = this.store.equipmentActionState();
    return this.dialog() === null && state?.status === 'succeeded' && state.action !== 'threshold'
      ? EQUIPMENT_ACTION_SUCCESS_KEYS[state.action]
      : null;
  });
  protected readonly thresholdSaved = computed(() => {
    const state = this.store.equipmentActionState();
    return state?.action === 'threshold' && state.status === 'succeeded';
  });
  protected readonly thresholdPending = computed(() => {
    const state = this.store.equipmentActionState();
    return state?.action === 'threshold' && state.status === 'pending';
  });
  /** The failure of the last action, shown in its dialog or next to the threshold form. */
  private readonly failureKey = computed(() => {
    const state = this.store.equipmentActionState();
    return state?.status === 'failed' && state.failure !== null
      ? equipmentActionErrorKey(state.action, state.failure)
      : null;
  });
  protected readonly dialogErrorKey = computed(() =>
    this.dialog() === null ? null : this.failureKey(),
  );
  protected readonly thresholdErrorKey = computed(() =>
    this.store.equipmentActionState()?.action === 'threshold' ? this.failureKey() : null,
  );
  /** A failure that closed its dialog, such as a status transition the backend refused. */
  protected readonly pageErrorKey = computed(() => {
    const state = this.store.equipmentActionState();
    return this.dialog() === null && state?.action !== 'threshold' ? this.failureKey() : null;
  });

  constructor() {
    this.store.loadSites();
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.equipmentId.set(Number(params.get('equipmentId')));
        this.dialog.set(null);
        this.load();
      });

    // A successful action, or a refused status transition (the item was reloaded), closes its dialog.
    effect(() => {
      const state = this.store.equipmentActionState();
      if (
        state?.status === 'succeeded' ||
        (state?.status === 'failed' && state.failure === 'INVALID_STATUS_TRANSITION')
      ) {
        untracked(() => this.dialog.set(null));
      }
    });
  }

  protected load(): void {
    this.store.clearEquipmentActionState();
    const equipmentId = this.equipmentId();
    if (isEquipmentId(equipmentId)) {
      this.store.loadEquipment(equipmentId);
    }
  }

  protected openDialog(dialog: DetailDialog): void {
    this.store.clearEquipmentActionState();
    this.dialog.set(dialog);
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    if (this.store.equipmentActionState()?.status === 'failed') {
      this.store.clearEquipmentActionState();
    }
  }

  protected saveChanges(changes: EquipmentChanges): void {
    this.store.updateEquipment(changes);
  }

  protected saveThreshold(threshold: TemperatureThreshold): void {
    this.store.changeThreshold(threshold);
  }

  protected changeStatus(status: StatusEquipment): void {
    this.store.changeStatus(status);
  }
}
