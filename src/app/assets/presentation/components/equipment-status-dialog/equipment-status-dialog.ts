import { Component, computed, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { Equipment } from '@assets/domain/model/equipment.entity';
import { nextStatusesOf, StatusEquipment } from '@assets/domain/value-objects/status-equipment';
import { STATUS_EQUIPMENT_APPEARANCE } from '@assets/presentation/equipment-appearance';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';

/**
 * Dialog to move an equipment item to another lifecycle status. It offers only the transitions allowed
 * from the current status and warns before a deactivation, which stops the item from reporting.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, Icon, StatusTag],
  selector: 'app-equipment-status-dialog',
  styleUrl: './equipment-status-dialog.css',
  templateUrl: './equipment-status-dialog.html',
})
export class EquipmentStatusDialog {
  readonly equipment = input.required<Equipment>();
  /** Whether the change is in progress. */
  readonly pending = input(false);
  /** The translation key of the failure of the last change, if any. */
  readonly errorKey = input<string | null>(null);
  readonly confirmed = output<StatusEquipment>();
  readonly closed = output<void>();

  protected readonly statusAppearance = STATUS_EQUIPMENT_APPEARANCE;
  protected readonly options = computed(() => nextStatusesOf(this.equipment().status));

  protected readonly form = inject(NonNullableFormBuilder).group({
    status: ['' as StatusEquipment | '', Validators.required],
  });
  private readonly selected = toSignal(this.form.controls.status.valueChanges, {
    initialValue: this.form.controls.status.value,
  });
  protected readonly deactivating = computed(() => this.selected() === StatusEquipment.DEACTIVATED);

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    const { status } = this.form.getRawValue();
    if (status === '') {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmed.emit(status);
  }

  protected missingChoice(): boolean {
    const control = this.form.controls.status;
    return control.touched && control.hasError('required');
  }
}
