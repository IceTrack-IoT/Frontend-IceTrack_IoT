import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DevicesStore } from '@device/application/devices-store';
import { DEVICE_TEXT_MAX_LENGTH } from '@device/application/contracts/device-pairing';
import { IssuedApiKey } from '@device/presentation/components/issued-api-key/issued-api-key';
import { deviceActionErrorKey } from '@device/presentation/device-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';

/** A value with at least one non-blank character, as the backend's `@NotBlank` requires. */
const NOT_BLANK = /\S/;

type TextField = 'deviceUid' | 'boardModel' | 'firmwareVersion';

/**
 * Pairs a board with one of the owner's equipment items that has no paired device. The backend issues the
 * device's API key in its answer, the only time it is ever shown: the confirmation displays it until the
 * owner confirms having stored it, and it is dropped once the owner leaves or pairs another board. The
 * `equipmentId` query parameter preselects the equipment.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Icon, IssuedApiKey, StatePanel],
  selector: 'app-pair-device',
  styleUrl: './pair-device.css',
  templateUrl: './pair-device.html',
})
export class PairDevice {
  protected readonly store = inject(DevicesStore);
  protected readonly maxLength = DEVICE_TEXT_MAX_LENGTH;
  private readonly requestedEquipmentId = Number(
    inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'),
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    equipmentId: [null as number | null, Validators.required],
    deviceUid: [
      '',
      [
        Validators.required,
        Validators.pattern(NOT_BLANK),
        Validators.maxLength(DEVICE_TEXT_MAX_LENGTH),
      ],
    ],
    boardModel: [
      '',
      [
        Validators.required,
        Validators.pattern(NOT_BLANK),
        Validators.maxLength(DEVICE_TEXT_MAX_LENGTH),
      ],
    ],
    firmwareVersion: ['', Validators.maxLength(DEVICE_TEXT_MAX_LENGTH)],
  });

  /** Whether the owner confirmed having stored the issued key. */
  protected readonly keyStored = signal(false);
  private readonly successHeading = viewChild<ElementRef<HTMLElement>>('successHeading');

  /** The pairing just confirmed, with the key issued for it. */
  protected readonly pairing = computed(() => {
    const state = this.store.actionState();
    if (
      state?.action !== 'pair' ||
      state.status !== 'succeeded' ||
      state.device === null ||
      state.issuedApiKey === null
    ) {
      return null;
    }
    const equipmentId = state.device.paired_equipment_id;
    return {
      device: state.device,
      apiKey: state.issuedApiKey,
      equipment:
        equipmentId === null ? null : (this.store.equipmentById().get(equipmentId) ?? null),
    };
  });
  /** Why the last pairing failed. */
  protected readonly errorKey = computed(() => {
    const state = this.store.actionState();
    return state?.action === 'pair' && state.status === 'failed'
      ? deviceActionErrorKey('pair', state.failure)
      : null;
  });

  constructor() {
    this.store.attach(inject(DestroyRef));
    this.store.clearAction();
    this.load();
    // The form is replaced by the confirmation, so the focus moves to its heading.
    afterRenderEffect(() => this.successHeading()?.nativeElement.focus());
    // Preselects the requested equipment once the owner's equipment is known.
    effect(() => {
      const pairable = this.store.pairableEquipment();
      untracked(() => {
        const control = this.form.controls.equipmentId;
        if (control.value === null && pairable.some(({ id }) => id === this.requestedEquipmentId)) {
          control.setValue(this.requestedEquipmentId);
        }
      });
    });
  }

  protected load(): void {
    this.store.loadInventory();
  }

  protected submit(): void {
    if (this.store.actionPending()) {
      return;
    }
    const { equipmentId, deviceUid, boardModel, firmwareVersion } = this.form.getRawValue();
    if (this.form.invalid || equipmentId === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.pairDevice({ equipmentId, deviceUid, boardModel, firmwareVersion });
  }

  /** Drops the issued key and starts a new pairing. */
  protected pairAnother(): void {
    this.store.clearAction();
    this.keyStored.set(false);
    this.form.reset();
  }

  protected showError(name: 'equipmentId' | TextField): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  /** The translation key of the validation error of a text field. */
  protected textErrorKey(name: TextField): string {
    const errors = this.form.controls[name].errors;
    if (errors?.['maxlength']) {
      return 'devices.pairing.tooLong';
    }
    return name === 'deviceUid'
      ? 'devices.pairing.deviceUidRequired'
      : 'devices.pairing.boardModelRequired';
  }
}
