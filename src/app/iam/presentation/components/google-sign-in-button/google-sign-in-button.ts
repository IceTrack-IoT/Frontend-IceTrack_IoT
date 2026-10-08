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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import { GoogleIdentityServices } from '@iam/infrastructure/google/google-identity-services';

/**
 * Renders Google's "Continue with Google" button in the active language and emits the credential issued
 * by Google. When Google sign-in cannot be loaded, a translated notice replaces the button; provider
 * details are never shown.
 */
@Component({
  imports: [TranslatePipe],
  selector: 'app-google-sign-in-button',
  styleUrl: './google-sign-in-button.css',
  templateUrl: './google-sign-in-button.html',
})
export class GoogleSignInButton {
  readonly credential = output<GoogleCredential>();

  private readonly googleIdentity = inject(GoogleIdentityServices);
  private readonly translate = inject(TranslateService);
  private readonly button = viewChild.required<ElementRef<HTMLElement>>('button');
  protected readonly unavailable = signal(false);

  constructor() {
    this.googleIdentity.credentials
      .pipe(takeUntilDestroyed())
      .subscribe((credential) => this.credential.emit(credential));

    afterNextRender(() => {
      const container = this.button().nativeElement;
      this.googleIdentity
        .renderButton(container, {
          locale: this.translate.getCurrentLang() ?? undefined,
          width: container.clientWidth,
        })
        .catch(() => this.unavailable.set(true));
    });
  }
}
