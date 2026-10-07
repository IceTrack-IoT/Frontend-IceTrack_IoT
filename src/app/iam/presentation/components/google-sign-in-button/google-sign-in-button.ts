import {
  afterNextRender,
  Component,
  type ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import { GoogleIdentityServices } from '@iam/infrastructure/google/google-identity-services';

/**
 * Renders Google's sign-in button and emits the credential issued by Google.
 */
@Component({
  selector: 'app-google-sign-in-button',
  template: `
    @if (unavailable(); as reason) {
      <p role="status">{{ reason }}</p>
    }
    <div #button></div>
  `,
})
export class GoogleSignInButton {
  readonly credential = output<GoogleCredential>();

  private readonly googleIdentity = inject(GoogleIdentityServices);
  private readonly button = viewChild.required<ElementRef<HTMLElement>>('button');
  protected readonly unavailable = signal<string | null>(null);

  constructor() {
    this.googleIdentity.credentials
      .pipe(takeUntilDestroyed())
      .subscribe((credential) => this.credential.emit(credential));

    afterNextRender(() => {
      this.googleIdentity
        .renderButton(this.button().nativeElement)
        .catch((error: unknown) =>
          this.unavailable.set(
            error instanceof Error ? error.message : 'Google sign-in is unavailable.',
          ),
        );
    });
  }
}
