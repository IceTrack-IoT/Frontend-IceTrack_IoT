import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  DISMISS_REASONS,
  type DismissReason,
} from '@monitoring/presentation/monitoring-appearance';
import { Dialog } from '@shared/presentation/components/dialog/dialog';

/** The dismissal of an alert as collected by the dialog. */
export interface AlertDismissal {
  readonly reason: DismissReason;
  readonly notes: string;
}

const NOTES_MAX_LENGTH = 500;

/**
 * Confirmation to dismiss an alert as a false alarm. A reason is required; notes are optional.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog],
  selector: 'app-dismiss-alert-dialog',
  templateUrl: './dismiss-alert-dialog.html',
})
export class DismissAlertDialog {
  /** The translated description of the alert being dismissed. */
  readonly alertLabel = input.required<string>();
  /** Whether the dismissal is in progress. */
  readonly pending = input(false);
  readonly dismissed = output<AlertDismissal>();
  readonly closed = output<void>();

  protected readonly reasons = DISMISS_REASONS;
  protected readonly notesMaxLength = NOTES_MAX_LENGTH;
  protected readonly form = inject(NonNullableFormBuilder).group({
    reason: ['' as DismissReason | '', Validators.required],
    notes: ['', Validators.maxLength(NOTES_MAX_LENGTH)],
  });

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    const { reason, notes } = this.form.getRawValue();
    if (this.form.invalid || reason === '') {
      this.form.markAllAsTouched();
      return;
    }
    this.dismissed.emit({ reason, notes: notes.trim() });
  }

  protected showError(name: 'reason' | 'notes'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }
}
