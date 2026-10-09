import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Dialog } from '@shared/presentation/components/dialog/dialog';

const REASON_MIN_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

/**
 * Confirmation to cancel a service request. Cancellation cannot be undone, so the owner must give a
 * reason before confirming.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog],
  selector: 'app-cancel-request-dialog',
  templateUrl: './cancel-request-dialog.html',
})
export class CancelRequestDialog {
  /** The translated description of the service request. */
  readonly requestLabel = input.required<string>();
  /** Whether the cancellation is in progress. */
  readonly pending = input(false);
  readonly canceled = output<string>();
  readonly closed = output<void>();

  protected readonly reasonMaxLength = REASON_MAX_LENGTH;
  protected readonly form = inject(NonNullableFormBuilder).group({
    reason: [
      '',
      [
        Validators.required,
        Validators.minLength(REASON_MIN_LENGTH),
        Validators.maxLength(REASON_MAX_LENGTH),
      ],
    ],
  });

  protected confirm(): void {
    if (this.pending()) {
      return;
    }
    const { reason } = this.form.controls;
    if (reason.invalid) {
      reason.markAsTouched();
      return;
    }
    this.canceled.emit(reason.value.trim());
  }

  protected errorKey(): string | null {
    const { reason } = this.form.controls;
    if (!reason.touched || reason.valid) {
      return null;
    }
    if (reason.hasError('required')) {
      return 'serviceRequests.cancel.reasonRequired';
    }
    return reason.hasError('minlength')
      ? 'serviceRequests.cancel.reasonTooShort'
      : 'shared.validation.tooLong';
  }
}
