import { computed, type DestroyRef, inject, Injectable, signal, type Signal } from '@angular/core';
import { debounceTime, finalize, map, type Observable, type Subscription } from 'rxjs';
import type { Device } from '@device/domain/model/device.entity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';
import { type DeviceFailure, toDeviceFailure } from '@device/application/contracts/device-error';
import type { DeviceEquipment } from '@device/application/contracts/device-equipment';
import type { DeviceInventory } from '@device/application/contracts/device-inventory';
import type {
  DevicePairing,
  IssuedDeviceCredential,
} from '@device/application/contracts/device-pairing';
import { LoadDeviceInventoryUseCase } from '@device/application/use-cases/load-device-inventory.use-case';
import { PairDeviceUseCase } from '@device/application/use-cases/pair-device.use-case';
import { RevokeDeviceApiKeyUseCase } from '@device/application/use-cases/revoke-device-api-key.use-case';
import { RotateDeviceApiKeyUseCase } from '@device/application/use-cases/rotate-device-api-key.use-case';
import { UnpairDeviceUseCase } from '@device/application/use-cases/unpair-device.use-case';
import { WatchDeviceChangesUseCase } from '@device/application/use-cases/watch-device-changes.use-case';

/** How long the live changes are gathered before the inventory is read again, in milliseconds. */
const LIVE_CHANGES_DEBOUNCE_MS = 500;

/** The lifecycle actions the owner runs on devices. */
export type DeviceAction = 'pair' | 'unpair' | 'rotate' | 'revoke';

/** The outcome of the last device action, until it is cleared. */
export interface DeviceActionState {
  readonly action: DeviceAction;
  readonly status: 'pending' | 'succeeded' | 'failed';
  readonly failure: DeviceFailure | null;
  /** The device the action targets, as the backend answered it once the action succeeded. */
  readonly device: Device | null;
  /**
   * The plaintext API key issued by a pairing or a rotation. It lives only in memory until the action is
   * cleared or no device view is open, and is never persisted.
   */
  readonly issuedApiKey: string | null;
}

/** Failures meaning the loaded devices or equipment are stale and must be read again. */
const STALE_FAILURES: ReadonlySet<DeviceFailure> = new Set([
  'NOT_FOUND',
  'DEVICE_CONFLICT',
  'DUPLICATE_RESOURCE_CONFLICT',
  'INVALID_STATUS_TRANSITION',
  'CONCURRENT_MODIFICATION_CONFLICT',
]);

/** The device an action answers with, and the API key it issued, if any. */
interface ActionOutcome {
  readonly device: Device;
  readonly issuedApiKey: string | null;
}

const issued = (credential: IssuedDeviceCredential): ActionOutcome => ({
  device: credential.device,
  issuedApiKey: credential.apiKey,
});

const withoutKey = (device: Device): ActionOutcome => ({ device, issuedApiKey: null });

const byUid = (first: Device, second: Device): number =>
  first.device_uid.localeCompare(second.device_uid);

/**
 * Devices Store manages the owner's monitoring devices: the equipment they can be paired with, the devices
 * linked to that equipment, and the outcome of pairing, unpairing, key rotation and key revocation.
 *
 * It holds signal-based state only and delegates every operation to Device Management use cases. Actions
 * are not applied optimistically: the device is replaced by the one the backend answers, and a rejected
 * action reads the inventory again when it means the shown state is stale.
 *
 * The inventory is kept for the owner session, so a device view opened again shows it at once while it is
 * read again. An issued API key is kept only in the action state, which is discarded once no device view
 * is open; everything is discarded when the session ends.
 */
@Injectable({
  providedIn: 'root',
})
export class DevicesStore {
  private readonly loadDeviceInventoryUseCase = inject(LoadDeviceInventoryUseCase);
  private readonly watchDeviceChangesUseCase = inject(WatchDeviceChangesUseCase);
  private readonly pairDeviceUseCase = inject(PairDeviceUseCase);
  private readonly unpairDeviceUseCase = inject(UnpairDeviceUseCase);
  private readonly rotateDeviceApiKeyUseCase = inject(RotateDeviceApiKeyUseCase);
  private readonly revokeDeviceApiKeyUseCase = inject(RevokeDeviceApiKeyUseCase);

  // Inventory.
  private readonly equipmentSignal = signal<readonly DeviceEquipment[] | null>(null);
  private readonly devicesSignal = signal<readonly Device[] | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly failureSignal = signal<DeviceFailure | null>(null);
  /** Whether the inventory has been loaded at least once. */
  readonly loaded = computed(() => this.devicesSignal() !== null);
  readonly loading = this.loadingSignal.asReadonly();
  readonly failure = this.failureSignal.asReadonly();
  /** The owner's equipment, sorted by name, empty until it is loaded. */
  readonly equipment = computed(() =>
    [...(this.equipmentSignal() ?? [])].sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
  );
  readonly equipmentById: Signal<ReadonlyMap<number, DeviceEquipment>> = computed(
    () => new Map(this.equipment().map((item) => [item.id, item])),
  );
  /** The devices linked to the owner's equipment, sorted by board UID, empty until loaded. */
  readonly devices = computed(() => [...(this.devicesSignal() ?? [])].sort(byUid));
  readonly pairedCount = computed(
    () => this.devices().filter((device) => device.status === DeviceStatus.PAIRED).length,
  );
  readonly revokedCount = computed(
    () => this.devices().filter((device) => device.status === DeviceStatus.REVOKED).length,
  );
  /** The equipment that has no PAIRED device, so a board can be paired with it. */
  readonly pairableEquipment = computed(() => {
    const paired = new Set(
      this.devices()
        .filter((device) => device.status === DeviceStatus.PAIRED)
        .map((device) => device.paired_equipment_id),
    );
    return this.equipment().filter((item) => !paired.has(item.id));
  });

  // Actions.
  private readonly actionSignal = signal<DeviceActionState | null>(null);
  readonly actionState = this.actionSignal.asReadonly();
  readonly actionPending = computed(() => this.actionSignal()?.status === 'pending');

  private inventorySubscription: Subscription | null = null;
  private actionSubscription: Subscription | null = null;
  private liveChangesSubscription: Subscription | null = null;
  private attachedViews = 0;
  private retainedSession: DestroyRef | null = null;

  /**
   * Keeps the device state for a view. While any view is attached, the loaded inventory is read again
   * whenever a board changes lifecycle status from any session. Once the last one is destroyed, live
   * changes stop and the action state, including any issued API key, is discarded; the inventory is kept
   * until the session ends.
   * @param destroyRef - The lifetime of the view.
   * @param session - The lifetime of the owner session the inventory is kept for.
   */
  attach(destroyRef: DestroyRef, session: DestroyRef): void {
    this.retain(session);
    this.attachedViews++;
    if (this.liveChangesSubscription === null) {
      this.liveChangesSubscription = this.watchDeviceChangesUseCase
        .execute()
        .pipe(debounceTime(LIVE_CHANGES_DEBOUNCE_MS))
        .subscribe(() => {
          if (this.devicesSignal() !== null) {
            this.loadInventory();
          }
        });
    }
    destroyRef.onDestroy(() => {
      this.attachedViews--;
      if (this.attachedViews === 0) {
        this.detachViews();
      }
    });
  }

  /**
   * Loads the owner's equipment and devices, keeping the ones in memory until the new ones arrive.
   */
  loadInventory(): void {
    this.inventorySubscription?.unsubscribe();
    this.loadingSignal.set(true);
    this.failureSignal.set(null);
    this.inventorySubscription = this.loadDeviceInventoryUseCase
      .execute()
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (inventory) => this.applyInventory(inventory),
        error: (error: unknown) => this.failureSignal.set(toDeviceFailure(error)),
      });
  }

  /**
   * Pairs a board with one of the owner's equipment items; the issued API key is kept in the action state.
   * @param pairing - The equipment and the board.
   */
  pairDevice(pairing: DevicePairing): void {
    this.runAction(
      'pair',
      null,
      this.pairDeviceUseCase.execute(pairing).pipe(map(issued)),
      (device) => this.applyDevice(device),
    );
  }

  /**
   * Rotates the API key of a PAIRED or REVOKED device; the new key is kept in the action state.
   * @param device - The device.
   */
  rotateApiKey(device: Device): void {
    this.runAction(
      'rotate',
      device,
      this.rotateDeviceApiKeyUseCase.execute(device).pipe(map(issued)),
      (rotated) => this.applyDevice(rotated),
    );
  }

  /**
   * Revokes the API key of a PAIRED device.
   * @param device - The device.
   */
  revokeApiKey(device: Device): void {
    this.runAction(
      'revoke',
      device,
      this.revokeDeviceApiKeyUseCase.execute(device).pipe(map(withoutKey)),
      (revoked) => this.applyDevice(revoked),
    );
  }

  /**
   * Unlinks a PAIRED or REVOKED device from its equipment; it leaves the list, since the backend lists
   * only linked devices.
   * @param device - The device.
   */
  unpairDevice(device: Device): void {
    this.runAction(
      'unpair',
      device,
      this.unpairDeviceUseCase.execute(device).pipe(map(withoutKey)),
      (unpaired) =>
        this.devicesSignal.update(
          (devices) => devices?.filter((candidate) => candidate.id !== unpaired.id) ?? null,
        ),
    );
  }

  /** Forgets the outcome of the last action, including any issued API key. */
  clearAction(): void {
    if (!this.actionPending()) {
      this.actionSignal.set(null);
    }
  }

  private runAction(
    action: DeviceAction,
    device: Device | null,
    run: Observable<ActionOutcome>,
    apply: (device: Device) => void,
  ): void {
    if (this.actionPending()) {
      return;
    }
    this.actionSignal.set({ action, status: 'pending', failure: null, device, issuedApiKey: null });
    this.actionSubscription = run.subscribe({
      next: (outcome) => {
        apply(outcome.device);
        this.actionSignal.set({
          action,
          status: 'succeeded',
          failure: null,
          device: outcome.device,
          issuedApiKey: outcome.issuedApiKey,
        });
      },
      error: (error: unknown) => {
        const failure = toDeviceFailure(error);
        this.actionSignal.set({ action, status: 'failed', failure, device, issuedApiKey: null });
        if (STALE_FAILURES.has(failure)) {
          this.loadInventory();
        }
      },
    });
  }

  private applyInventory(inventory: DeviceInventory): void {
    this.equipmentSignal.set(inventory.equipment);
    this.devicesSignal.set(inventory.devices);
  }

  /** Puts the device as the backend recorded it in the list. */
  private applyDevice(device: Device): void {
    this.devicesSignal.update((devices) =>
      devices === null
        ? null
        : [...devices.filter((candidate) => candidate.id !== device.id), device],
    );
  }

  private retain(session: DestroyRef): void {
    if (this.retainedSession === session) {
      return;
    }
    this.retainedSession = session;
    session.onDestroy(() => {
      if (this.retainedSession === session) {
        this.retainedSession = null;
        this.release();
      }
    });
  }

  /** Stops live changes and discards the action state and any issued API key once no view is open. */
  private detachViews(): void {
    this.liveChangesSubscription?.unsubscribe();
    this.liveChangesSubscription = null;
    this.inventorySubscription?.unsubscribe();
    this.inventorySubscription = null;
    this.actionSubscription?.unsubscribe();
    this.actionSubscription = null;
    this.loadingSignal.set(false);
    this.actionSignal.set(null);
  }

  /** Discards every loaded value once the session ends. */
  private release(): void {
    this.detachViews();
    this.equipmentSignal.set(null);
    this.devicesSignal.set(null);
    this.loadingSignal.set(false);
    this.failureSignal.set(null);
    this.actionSignal.set(null);
  }
}
