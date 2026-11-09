import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import {
  authenticationContinuationUrl,
  followAuthenticationContinuation,
  GOOGLE_ACCOUNT_LINK_URL,
} from '@iam/presentation/authentication-continuation';
import { googleAccountLinkErrorKey } from '@iam/presentation/authentication-feedback';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';

/** The maximum password length accepted by the backend. */
const PASSWORD_MAX_LENGTH = 255;

/**
 * Links a Google account to the existing password account that uses its email, after the backend
 * answered that a link is required. The owner confirms the password of that account; afterwards both
 * Google and password sign-in work. The Google ID token stays in IamStore memory: this view never reads
 * or renders it.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PublicLayout],
  selector: 'app-link-google-account',
  styleUrls: [
    '../../styles/iam-card.css',
    '../../styles/iam-form.css',
    './link-google-account.css',
  ],
  templateUrl: './link-google-account.html',
})
export class LinkGoogleAccount {
  protected readonly iamStore = inject(IamStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly form = inject(NonNullableFormBuilder).group({
    password: ['', [Validators.required, Validators.maxLength(PASSWORD_MAX_LENGTH)]],
  });

  /**
   * - `pending`: a Google credential awaits the password of the existing account. The form also stays
   *   in place while the view continues to another step, so the expired notice never flashes.
   * - `completed`: the account is linked and the session started.
   * - `unavailable`: no Google credential is pending, e.g. after a reload (it is kept in memory only)
   *   or after the backend rejected the Google ID token (it may have expired).
   */
  protected readonly state = computed<'pending' | 'completed' | 'unavailable'>(() => {
    if (this.iamStore.isAuthenticated()) {
      return 'completed';
    }
    if (this.iamStore.googleAccountLinkRequired()) {
      return 'pending';
    }
    return authenticationContinuationUrl(this.iamStore) === null ? 'unavailable' : 'pending';
  });

  /** Failures are shown only for submissions from this view, never for the Google sign-in that led here. */
  private readonly submitted = signal(false);

  protected readonly errorKey = computed(() =>
    this.submitted() && this.iamStore.error() !== null
      ? googleAccountLinkErrorKey(this.iamStore.errorCode())
      : null,
  );

  constructor() {
    followAuthenticationContinuation(GOOGLE_ACCOUNT_LINK_URL);
  }

  protected submit(): void {
    if (this.iamStore.loading() || !this.iamStore.googleAccountLinkRequired()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusPassword();
      return;
    }
    this.submitted.set(true);
    this.iamStore.linkGoogleAccount(this.form.controls.password.value);
  }

  protected passwordErrorKey(): string | null {
    const control = this.form.controls.password;
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'iam.validation.required';
    }
    if (control.hasError('maxlength')) {
      return 'iam.validation.passwordTooLong';
    }
    return null;
  }

  private focusPassword(): void {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('#link-account-password')?.focus(),
      { injector: this.injector },
    );
  }
}
