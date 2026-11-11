import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { Device } from '@device/domain/model/device.entity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';
import { DevicesStore } from '@device/application/devices-store';
import {
  type CredentialAction,
  CredentialActionDialog,
  type CredentialActionResult,
} from '@device/presentation/components/credential-action-dialog/credential-action-dialog';
import {
  DEVICE_CONNECTIVITY_APPEARANCE,
  DEVICE_STATUS_APPEARANCE,
} from '@device/presentation/device-appearance';
import {
  DEVICE_ACTION_SUCCESS_KEYS,
  deviceActionErrorKey,
} from '@device/presentation/device-feedback';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';

/** The lifecycle statuses the list can be narrowed to; unpaired devices are never listed. */
type StatusFilter = 'all' | DeviceStatus.PAIRED | DeviceStatus.REVOKED;

/** The action the owner is confirming on a device. */
interface Confirmation {
  readonly device: Device;
  readonly action: CredentialAction | 'unpair';
}

/**
 * Monitoring devices linked to the owner's equipment, with their lifecycle status, key state and last
 * activity. From here the owner pairs a board, unpairs a device, and rotates, reissues or revokes its API
 * key. The `equipmentId` query parameter shows the devices of one equipment item.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    CredentialActionDialog,
    Dialog,
    Icon,
    StatePanel,
    StatusTag,
    RelativeTimePipe,
  ],
  selector: 'app-device-list',
  styleUrl: './device-list.css',
  templateUrl: './device-list.html',
})
export class DeviceList {
  protected readonly store = inject(DevicesStore);
  protected readonly statusAppearance = DEVICE_STATUS_APPEARANCE;
  protected readonly connectivityAppearance = DEVICE_CONNECTIVITY_APPEARANCE;
  protected readonly DeviceStatus = DeviceStatus;

  protected readonly equipmentFilter = this.equipmentIdParam();
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly confirming = signal<Confirmation | null>(null);
  /** The translation key of the outcome of the last action, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  /** The devices of the selected equipment, or all of them. */
  private readonly scoped = computed(() =>
    this.store
      .devices()
      .filter(
        (device) =>
          this.equipmentFilter === null || device.paired_equipment_id === this.equipmentFilter,
      ),
  );
  protected readonly pairedCount = computed(
    () => this.scoped().filter((device) => device.status === DeviceStatus.PAIRED).length,
  );
  protected readonly revokedCount = computed(
    () => this.scoped().filter((device) => device.status === DeviceStatus.REVOKED).length,
  );
  protected readonly filtered = computed(() => {
    const filter = this.statusFilter();
    return this.scoped().filter((device) => filter === 'all' || device.status === filter);
  });
  protected readonly filteredEquipmentName = computed(() =>
    this.equipmentFilter === null
      ? null
      : (this.store.equipmentById().get(this.equipmentFilter)?.name ?? `#${this.equipmentFilter}`),
  );

  /** The outcome of the credential action being confirmed, once it succeeded. */
  protected readonly credentialResult = computed<CredentialActionResult | null>(() => {
    const state = this.store.actionState();
    return state?.status === 'succeeded' &&
      (state.action === 'rotate' || state.action === 'revoke') &&
      this.confirming() !== null
      ? { issuedKey: state.issuedApiKey }
      : null;
  });
  /** Why the action being confirmed failed. */
  protected readonly dialogErrorKey = computed(() => {
    const state = this.store.actionState();
    return state?.status === 'failed' && this.confirming() !== null
      ? deviceActionErrorKey(state.action, state.failure)
      : null;
  });

  constructor() {
    this.store.attach(inject(DestroyRef));
    this.store.clearAction();
    this.load();
    // A successful unpairing closes its dialog; the device leaves the list.
    effect(() => {
      const state = this.store.actionState();
      if (state?.action === 'unpair' && state.status === 'succeeded') {
        untracked(() => {
          this.confirming.set(null);
          this.announcement.set(DEVICE_ACTION_SUCCESS_KEYS.unpair);
          this.store.clearAction();
        });
      }
    });
  }

  protected load(): void {
    this.store.loadInventory();
  }

  protected equipmentName(device: Device): string | null {
    return device.paired_equipment_id === null
      ? null
      : (this.store.equipmentById().get(device.paired_equipment_id)?.name ?? null);
  }

  protected siteName(device: Device): string | null {
    return device.paired_equipment_id === null
      ? null
      : (this.store.equipmentById().get(device.paired_equipment_id)?.siteName ?? null);
  }

  protected confirm(device: Device, action: Confirmation['action']): void {
    this.announcement.set(null);
    this.store.clearAction();
    this.confirming.set({ device, action });
  }

  protected applyCredentialAction(): void {
    const confirmation = this.confirming();
    if (!confirmation) {
      return;
    }
    if (confirmation.action === 'revoke') {
      this.store.revokeApiKey(confirmation.device);
    } else if (confirmation.action !== 'unpair') {
      this.store.rotateApiKey(confirmation.device);
    }
  }

  protected unpair(): void {
    const confirmation = this.confirming();
    if (confirmation?.action === 'unpair') {
      this.store.unpairDevice(confirmation.device);
    }
  }

  /** Closing the dialog drops any issued key from memory. */
  protected closeConfirmation(): void {
    if (this.store.actionPending()) {
      return;
    }
    const state = this.store.actionState();
    if (state?.status === 'succeeded') {
      this.announcement.set(DEVICE_ACTION_SUCCESS_KEYS[state.action]);
    }
    this.store.clearAction();
    this.confirming.set(null);
  }

  private equipmentIdParam(): number | null {
    const equipmentId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'));
    return Number.isInteger(equipmentId) && equipmentId > 0 ? equipmentId : null;
  }
}
