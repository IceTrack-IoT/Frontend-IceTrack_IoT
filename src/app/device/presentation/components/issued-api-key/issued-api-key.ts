import { Component, DOCUMENT, inject, input, signal } from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '@shared/presentation/components/icon/icon';

let nextIssuedKeyId = 0;

/**
 * Shows a device API key the backend has just issued, which is returned only once: a warning, the key with
 * a copy action, and a confirmation the owner checks once the key is stored. The key is only rendered; it
 * is never logged or persisted, and it disappears with the component.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Icon],
  selector: 'app-issued-api-key',
  styleUrl: './issued-api-key.css',
  templateUrl: './issued-api-key.html',
})
export class IssuedApiKey {
  /** The plaintext API key. */
  readonly apiKey = input.required<string>();

  protected readonly fieldId = `issued-api-key-${nextIssuedKeyId++}`;
  protected readonly stored = new FormControl(false, { nonNullable: true });
  /** Emits whether the owner confirms having stored the key. */
  readonly storedChange = outputFromObservable(this.stored.valueChanges);
  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  private readonly clipboard = inject(DOCUMENT).defaultView?.navigator.clipboard;

  protected async copy(): Promise<void> {
    try {
      if (!this.clipboard) {
        throw new Error('Clipboard unavailable');
      }
      await this.clipboard.writeText(this.apiKey());
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
  }
}
