import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  type AlertDismissal,
  DISMISS_EVIDENCE_MAX_LENGTH,
  DISMISS_REASON_MAX_LENGTH,
} from '@monitoring/application/contracts/alert-dismissal';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Confirmation to dismiss an alert as a false alarm. A reason is required; evidence is optional. The
 * dialog stays open while the dismissal is in progress and when it fails.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, Icon],
  selector: 'app-dismiss-alert-dialog',
  templateUrl: './dismiss-alert-dialog.html',
})
export class DismissAlertDialog {
  /** The translated description of the alert being dismissed. */
  readonly alertLabel = input.required<string>();
  /** Whether the dismissal is in progress. */
  readonly pending = input(false);
  /** The translation key of why the last dismissal failed, if it did. */
  readonly errorKey = input<string | null>(null);
  readonly dismissed = output<AlertDismissal>();
  readonly closed = output<void>();

  protected readonly reasonMaxLength = DISMISS_REASON_MAX_LENGTH;
  protected readonly evidenceMaxLength = DISMISS_EVIDENCE_MAX_LENGTH;
  protected readonly form = inject(NonNullableFormBuilder).group({
    reason: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(DISMISS_REASON_MAX_LENGTH),
      ],
    ],
    evidence: ['', Validators.maxLength(DISMISS_EVIDENCE_MAX_LENGTH)],
  });

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { reason, evidence } = this.form.getRawValue();
    this.dismissed.emit({ reason: reason.trim(), evidence: evidence.trim() || null });
  }

  protected showError(name: 'reason' | 'evidence'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }
}
