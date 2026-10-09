import { Component, DOCUMENT, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';

/** The credential actions an owner can request for a paired device. */
export type CredentialAction = 'rotate' | 'revoke';

/** The outcome of an applied credential action. */
export interface CredentialActionResult {
  /** The plain key issued by a rotation, shown only once; null after a revocation. */
  readonly issuedKey: string | null;
}

/**
 * Confirmation and outcome of a device credential rotation or revocation. Both actions invalidate the
 * current credential, so a revocation requires an explicit acknowledgement. A newly issued key is shown
 * only while the dialog is open, and the owner confirms having stored it before closing; it is never
 * persisted.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, Icon],
  selector: 'app-credential-action-dialog',
  styleUrl: './credential-action-dialog.css',
  templateUrl: './credential-action-dialog.html',
})
export class CredentialActionDialog {
  readonly action = input.required<CredentialAction>();
  /** The translated description of the device and its equipment. */
  readonly deviceLabel = input.required<string>();
  /** Whether the action is in progress. */
  readonly pending = input(false);
  /** The outcome of the action once applied; null while it awaits confirmation. */
  readonly result = input<CredentialActionResult | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  protected readonly acknowledged = new FormControl(false, { nonNullable: true });
  protected readonly stored = new FormControl(false, { nonNullable: true });
  protected readonly keyStored = toSignal(this.stored.valueChanges, { initialValue: false });
  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  private readonly clipboard = inject(DOCUMENT).defaultView?.navigator.clipboard;

  protected confirm(): void {
    if (this.pending()) {
      return;
    }
    if (this.action() === 'revoke' && !this.acknowledged.value) {
      this.acknowledged.markAsTouched();
      return;
    }
    this.confirmed.emit();
  }

  protected async copy(key: string): Promise<void> {
    try {
      if (!this.clipboard) {
        throw new Error('Clipboard unavailable');
      }
      await this.clipboard.writeText(key);
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
  }
}
