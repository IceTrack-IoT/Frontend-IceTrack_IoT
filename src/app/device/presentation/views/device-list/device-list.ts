import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Device } from '@device/domain/model/device.entity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';
import {
  type CredentialAction,
  CredentialActionDialog,
  type CredentialActionResult,
} from '@device/presentation/components/credential-action-dialog/credential-action-dialog';
import { DEVICE_STATUS_APPEARANCE, maskedHash } from '@device/presentation/device-appearance';
import {
  createDevicesMock,
  DEVICE_EQUIPMENT,
  issueMockCredential,
} from '@device/presentation/mocks/devices.mock';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';

type PairingFilter = 'all' | 'paired' | 'unpaired';

/** A credential action being confirmed, and its outcome once applied. */
interface CredentialRequest {
  readonly device: Device;
  readonly action: CredentialAction;
  readonly result: CredentialActionResult | null;
}

/**
 * Monitoring devices of the owner with their pairing and credential state. From here the owner pairs,
 * unpairs, and rotates or revokes the credential of a device. The `equipmentId` query parameter shows the
 * device of one equipment item.
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
  protected readonly source = injectMockDataSource();
  protected readonly statusAppearance = DEVICE_STATUS_APPEARANCE;
  protected readonly maskedHash = maskedHash;

  protected readonly equipmentFilter = this.equipmentIdParam();
  protected readonly equipmentById = new Map(DEVICE_EQUIPMENT.map((item) => [item.id, item]));

  private readonly devices = signal<Device[]>([]);
  protected readonly pairingFilter = signal<PairingFilter>('all');
  protected readonly credentialRequest = signal<CredentialRequest | null>(null);
  protected readonly unpairTarget = signal<Device | null>(null);
  /** The translation key of the outcome of the last action, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  protected readonly pairedCount = computed(
    () => this.devices().filter((device) => device.equipment_id !== null).length,
  );
  protected readonly unpairedCount = computed(() => this.devices().length - this.pairedCount());
  protected readonly filtered = computed(() => {
    const filter = this.pairingFilter();
    return this.devices().filter(
      (device) =>
        (this.equipmentFilter === null || device.equipment_id === this.equipmentFilter) &&
        (filter === 'all' || (filter === 'paired') === (device.equipment_id !== null)),
    );
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.source.load((empty) => this.devices.set(empty ? [] : createDevicesMock()));
  }

  protected equipmentName(device: Device): string | null {
    return device.equipment_id === null
      ? null
      : (this.equipmentById.get(device.equipment_id)?.name ?? null);
  }

  protected openCredentialAction(device: Device, action: CredentialAction): void {
    this.announcement.set(null);
    this.credentialRequest.set({ device, action, result: null });
  }

  protected applyCredentialAction(): void {
    const request = this.credentialRequest();
    if (!request) {
      return;
    }
    // TODO: Delegate to the device store (rotate / revoke credential use cases).
    this.source.mutate(() => {
      let issuedKey: string | null = null;
      if (request.action === 'rotate') {
        const credential = issueMockCredential();
        request.device.api_key_hash = credential.hash;
        issuedKey = credential.key;
      } else {
        request.device.api_key_hash = null;
      }
      this.devices.update((devices) => [...devices]);
      this.credentialRequest.set({ ...request, result: { issuedKey } });
    });
  }

  /** Closing the dialog drops the issued key from memory. */
  protected closeCredentialAction(): void {
    const request = this.credentialRequest();
    if (request?.result) {
      this.announcement.set(
        request.action === 'rotate' ? 'devices.list.rotated' : 'devices.list.revoked',
      );
    }
    this.credentialRequest.set(null);
  }

  protected unpair(): void {
    const device = this.unpairTarget();
    if (!device) {
      return;
    }
    // TODO: Delegate to the device store (unpair device use case).
    this.source.mutate(() => {
      device.equipment_id = null;
      device.status = DeviceStatus.UNPAIRED;
      this.devices.update((devices) => [...devices]);
      this.unpairTarget.set(null);
      this.announcement.set('devices.list.unpaired');
    });
  }

  private equipmentIdParam(): number | null {
    const equipmentId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'));
    return Number.isInteger(equipmentId) && equipmentId > 0 ? equipmentId : null;
  }
}
