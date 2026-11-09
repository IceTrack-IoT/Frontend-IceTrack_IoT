import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CANCEL_REASON_MAX_LENGTH } from '@service/application/contracts/new-service-request';
import { Dialog } from '@shared/presentation/components/dialog/dialog';

/**
 * Confirmation to cancel a service request. Cancellation cannot be undone, so the owner must give a
 * reason (not blank, up to 500 characters) before confirming.
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
  /** The translation key of the last failure of the cancellation, if any. */
  readonly errorKey = input<string | null>(null);
  readonly canceled = output<string>();
  readonly closed = output<void>();

  protected readonly reasonMaxLength = CANCEL_REASON_MAX_LENGTH;
  protected readonly form = inject(NonNullableFormBuilder).group({
    reason: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(CANCEL_REASON_MAX_LENGTH),
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

  protected reasonErrorKey(): string | null {
    const { reason } = this.form.controls;
    if (!reason.touched || reason.valid) {
      return null;
    }
    return reason.hasError('maxlength')
      ? 'shared.validation.tooLong'
      : 'serviceRequests.cancel.reasonRequired';
  }
}
