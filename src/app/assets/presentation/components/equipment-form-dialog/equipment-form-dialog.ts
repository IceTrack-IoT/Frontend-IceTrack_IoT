import { Component, inject, input, type OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Equipment } from '@assets/domain/model/equipment.entity';
import { Site } from '@assets/domain/model/site.entity';
import { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import {
  THRESHOLD_HIGHEST_CELSIUS,
  THRESHOLD_LOWEST_CELSIUS,
} from '@assets/domain/value-objects/temperature-threshold';
import {
  EQUIPMENT_NAME_MAX_LENGTH,
  EQUIPMENT_UID_MAX_LENGTH,
  type EquipmentChanges,
  type NewEquipment,
} from '@assets/application/contracts/equipment-registration';
import {
  minBelowMax,
  THRESHOLD_BOUND_VALIDATORS,
  thresholdBoundErrorKey,
} from '@assets/presentation/threshold-validation';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';

/** A whole, positive number of days. */
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

type TextControl = 'siteId' | 'uid' | 'name' | 'type' | 'reminderIntervalDays';
type BoundControl = 'minCelsius' | 'maxCelsius';

/**
 * Dialog to register an equipment item at one of the owner's sites, or to edit the name, type and
 * maintenance interval of an existing one. The uid and site of an existing item cannot change, and its
 * threshold is edited in its own form; editing never removes its telemetry or service history.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Dialog, Icon],
  selector: 'app-equipment-form-dialog',
  templateUrl: './equipment-form-dialog.html',
})
export class EquipmentFormDialog implements OnInit {
  /** The equipment to edit, or null to register a new item. */
  readonly equipment = input<Equipment | null>(null);
  /** The owner's sites a new item can be installed at. */
  readonly sites = input.required<readonly Site[]>();
  /** The site preselected for a new item, if any. */
  readonly preselectedSiteId = input<number | null>(null);
  /** Whether the save is in progress. */
  readonly pending = input(false);
  /** The translation key of the failure of the last save, if any. */
  readonly errorKey = input<string | null>(null);
  readonly registered = output<NewEquipment>();
  readonly updated = output<EquipmentChanges>();
  readonly closed = output<void>();

  protected readonly types = Object.values(EquipmentType);
  protected readonly nameMaxLength = EQUIPMENT_NAME_MAX_LENGTH;
  protected readonly uidMaxLength = EQUIPMENT_UID_MAX_LENGTH;
  protected readonly lowestCelsius = THRESHOLD_LOWEST_CELSIUS;
  protected readonly highestCelsius = THRESHOLD_HIGHEST_CELSIUS;

  private readonly formBuilder = inject(FormBuilder);
  protected readonly form = this.formBuilder.group(
    {
      siteId: this.formBuilder.control<number | null>(null, Validators.required),
      uid: this.formBuilder.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(EQUIPMENT_UID_MAX_LENGTH),
      ]),
      name: this.formBuilder.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(EQUIPMENT_NAME_MAX_LENGTH),
      ]),
      type: this.formBuilder.control<EquipmentType | null>(null, Validators.required),
      reminderIntervalDays: this.formBuilder.control<number | null>(null, [
        Validators.required,
        Validators.pattern(POSITIVE_INTEGER_PATTERN),
      ]),
      minCelsius: this.formBuilder.control<number | null>(null, THRESHOLD_BOUND_VALIDATORS),
      maxCelsius: this.formBuilder.control<number | null>(null, THRESHOLD_BOUND_VALIDATORS),
    },
    { validators: minBelowMax },
  );

  ngOnInit(): void {
    const equipment = this.equipment();
    if (equipment === null) {
      const siteId = this.preselectedSiteId();
      if (siteId !== null && this.sites().some((site) => site.id === siteId)) {
        this.form.controls.siteId.setValue(siteId);
      }
      return;
    }
    this.form.patchValue({
      siteId: equipment.site_id,
      uid: equipment.equipment_code_uid,
      name: equipment.name,
      type: equipment.equipment_type,
      reminderIntervalDays: equipment.reminder_interval_days,
      minCelsius: equipment.temperature_threshold.min_celsius,
      maxCelsius: equipment.temperature_threshold.max_celsius,
    });
    // Only the name, type and maintenance interval of an existing item are editable here.
    this.form.controls.siteId.disable();
    this.form.controls.uid.disable();
    this.form.controls.minCelsius.disable();
    this.form.controls.maxCelsius.disable();
  }

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    const value = this.form.getRawValue();
    const { siteId, type, reminderIntervalDays, minCelsius, maxCelsius } = value;
    if (this.form.invalid || type === null || reminderIntervalDays === null) {
      this.form.markAllAsTouched();
      return;
    }
    const changes: EquipmentChanges = {
      name: value.name,
      type,
      reminderIntervalDays: Number(reminderIntervalDays),
    };
    if (this.equipment() !== null) {
      this.updated.emit(changes);
      return;
    }
    if (siteId === null || minCelsius === null || maxCelsius === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.registered.emit({
      ...changes,
      siteId,
      uid: value.uid,
      threshold: { min_celsius: minCelsius, max_celsius: maxCelsius },
    });
  }

  protected fieldErrorKey(name: TextControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required')) {
      return 'shared.validation.required';
    }
    if (control.hasError('maxlength')) {
      return 'shared.validation.tooLong';
    }
    return control.hasError('pattern') ? 'assets.validation.positiveDays' : null;
  }

  protected boundErrorKey(name: BoundControl): string | null {
    return thresholdBoundErrorKey(this.form.controls[name]);
  }

  /** Whether the threshold limits are inverted, once the owner has edited either of them. */
  protected rangeInvalid(): boolean {
    const { minCelsius, maxCelsius } = this.form.controls;
    return (minCelsius.touched || maxCelsius.touched) && this.form.hasError('minNotBelowMax');
  }

  protected describedBy(name: BoundControl): string {
    return [
      'equipment-threshold-hint',
      this.boundErrorKey(name) ? `equipment-${name}-error` : null,
      this.rangeInvalid() ? 'equipment-range-error' : null,
    ]
      .filter((id) => id !== null)
      .join(' ');
  }
}
