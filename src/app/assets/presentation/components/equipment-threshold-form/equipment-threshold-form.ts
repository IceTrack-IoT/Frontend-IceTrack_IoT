import { Component, inject, input, type OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';

/** The minimum temperature must be strictly lower than the maximum temperature. */
const minBelowMax: ValidatorFn = (group) => {
  const min: unknown = group.get('minCelsius')?.value;
  const max: unknown = group.get('maxCelsius')?.value;
  return typeof min === 'number' && typeof max === 'number' && min >= max
    ? { minNotBelowMax: true }
    : null;
};

type ThresholdControl = 'minCelsius' | 'maxCelsius';

/**
 * Form of the temperature threshold of an equipment item, in degrees Celsius. It only checks that both
 * limits are present and that the minimum is lower than the maximum; the backend stays authoritative.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe],
  selector: 'app-equipment-threshold-form',
  styleUrl: './equipment-threshold-form.css',
  templateUrl: './equipment-threshold-form.html',
})
export class EquipmentThresholdForm implements OnInit {
  readonly threshold = input.required<TemperatureThreshold>();
  /** Whether the save is in progress. */
  readonly pending = input(false);
  readonly saved = output<TemperatureThreshold>();

  private readonly formBuilder = inject(FormBuilder);
  protected readonly form = this.formBuilder.group(
    {
      minCelsius: this.formBuilder.control<number | null>(null, Validators.required),
      maxCelsius: this.formBuilder.control<number | null>(null, Validators.required),
    },
    { validators: minBelowMax },
  );

  ngOnInit(): void {
    this.discard();
  }

  protected discard(): void {
    const { min_celsius, max_celsius } = this.threshold();
    this.form.reset({ minCelsius: min_celsius, maxCelsius: max_celsius });
  }

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    const { minCelsius, maxCelsius } = this.form.getRawValue();
    if (this.form.invalid || minCelsius === null || maxCelsius === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit({ min_celsius: minCelsius, max_celsius: maxCelsius });
  }

  protected fieldErrorKey(name: ThresholdControl): string | null {
    const control = this.form.controls[name];
    return control.touched && control.hasError('required') ? 'shared.validation.required' : null;
  }

  /** Whether the limits are inverted, once the owner has edited either of them. */
  protected rangeInvalid(): boolean {
    const { minCelsius, maxCelsius } = this.form.controls;
    return (minCelsius.touched || maxCelsius.touched) && this.form.hasError('minNotBelowMax');
  }

  protected describedBy(name: ThresholdControl): string {
    return [
      'threshold-hint',
      this.fieldErrorKey(name) ? `threshold-${name}-error` : null,
      this.rangeInvalid() ? 'threshold-range-error' : null,
    ]
      .filter((id) => id !== null)
      .join(' ');
  }
}
