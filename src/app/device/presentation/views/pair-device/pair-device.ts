import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Device } from '@device/domain/model/device.entity';
import { DeviceStatus } from '@device/domain/value-objects/device-status';
import {
  createDevicesMock,
  DEVICE_EQUIPMENT,
  type PairableEquipment,
} from '@device/presentation/mocks/devices.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';

/** The pairing just confirmed. */
interface Pairing {
  readonly deviceId: number;
  readonly equipment: PairableEquipment;
}

/**
 * Pairs an unpaired monitoring device with an equipment item that has no device. The `deviceId` and
 * `equipmentId` query parameters preselect them. The credential of the device is issued afterwards from
 * the device list.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Icon, StatePanel],
  selector: 'app-pair-device',
  styleUrl: './pair-device.css',
  templateUrl: './pair-device.html',
})
export class PairDevice {
  private readonly route = inject(ActivatedRoute);
  protected readonly source = injectMockDataSource();

  protected readonly form = inject(NonNullableFormBuilder).group({
    deviceId: [null as number | null, Validators.required],
    equipmentId: [null as number | null, Validators.required],
  });

  private readonly devices = signal<Device[]>([]);
  protected readonly pairing = signal<Pairing | null>(null);
  private readonly successHeading = viewChild<ElementRef<HTMLElement>>('successHeading');

  protected readonly unpairedDevices = computed(() =>
    this.devices().filter((device) => device.equipment_id === null),
  );
  protected readonly availableEquipment = computed(() => {
    const paired = new Set(this.devices().map((device) => device.equipment_id));
    return DEVICE_EQUIPMENT.filter((item) => !paired.has(item.id));
  });

  constructor() {
    // The form is replaced by the confirmation, so the focus moves to its heading.
    afterRenderEffect(() => this.successHeading()?.nativeElement.focus());
    this.load();
  }

  protected load(): void {
    this.source.load((empty) => {
      this.devices.set(empty ? [] : createDevicesMock());
      this.preselect(
        'deviceId',
        this.unpairedDevices().map((device) => device.id),
      );
      this.preselect(
        'equipmentId',
        this.availableEquipment().map((item) => item.id),
      );
    });
  }

  protected submit(): void {
    if (this.source.pending()) {
      return;
    }
    const { deviceId, equipmentId } = this.form.getRawValue();
    const device = this.devices().find((candidate) => candidate.id === deviceId);
    const equipment = DEVICE_EQUIPMENT.find((item) => item.id === equipmentId);
    if (this.form.invalid || !device || !equipment) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO: Delegate to the device store (pair device use case).
    this.source.mutate(() => {
      device.equipment_id = equipment.id;
      device.status = DeviceStatus.PAIRED;
      this.devices.update((devices) => [...devices]);
      this.pairing.set({ deviceId: device.id, equipment });
    });
  }

  protected pairAnother(): void {
    this.form.reset();
    this.pairing.set(null);
  }

  protected showError(name: 'deviceId' | 'equipmentId'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  private preselect(name: 'deviceId' | 'equipmentId', candidates: number[]): void {
    const id = Number(this.route.snapshot.queryParamMap.get(name));
    if (candidates.includes(id)) {
      this.form.controls[name].setValue(id);
    }
  }
}
