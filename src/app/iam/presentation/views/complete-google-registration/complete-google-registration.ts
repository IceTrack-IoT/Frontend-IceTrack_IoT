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
  GOOGLE_REGISTRATION_URL,
} from '@iam/presentation/authentication-continuation';
import { registrationErrorKey } from '@iam/presentation/authentication-feedback';
import { phoneValidators, rucValidators } from '@iam/presentation/owner-registration-validators';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';

type CompleteRegistrationControl =
  | 'username'
  | 'phone'
  | 'ruc'
  | 'street'
  | 'number'
  | 'city'
  | 'postalCode'
  | 'country';

/** Translation keys of the `pattern` error of the fields that validate a format. */
const PATTERN_ERROR_KEYS: Partial<Record<CompleteRegistrationControl, string>> = {
  phone: 'iam.validation.phone',
  ruc: 'iam.validation.ruc',
};

/**
 * Completes the owner registration of a Google account that is not registered yet. The Google ID token
 * stays in IamStore memory: this view never reads or renders it. When the backend answers that the
 * Google email belongs to a password account, or that the account must use the mobile application, the
 * view continues to the account link or the technician redirect.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PublicLayout],
  selector: 'app-complete-google-registration',
  styleUrls: [
    '../../styles/iam-card.css',
    '../../styles/iam-form.css',
    './complete-google-registration.css',
  ],
  templateUrl: './complete-google-registration.html',
})
export class CompleteGoogleRegistration {
  protected readonly iamStore = inject(IamStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    phone: ['', phoneValidators],
    ruc: ['', rucValidators],
    street: ['', Validators.required],
    number: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['', Validators.required],
  });

  /**
   * - `pending`: a Google credential awaits the owner details. The form also stays in place while the
   *   view continues to another step, so the expired notice never flashes during that navigation.
   * - `completed`: the account exists and the session started.
   * - `unavailable`: no Google credential is pending, e.g. after a reload (it is kept in memory only)
   *   or after the backend rejected the Google ID token (it may have expired).
   */
  protected readonly state = computed<'pending' | 'completed' | 'unavailable'>(() => {
    if (this.iamStore.isAuthenticated()) {
      return 'completed';
    }
    if (this.iamStore.googleRegistrationRequired()) {
      return 'pending';
    }
    return authenticationContinuationUrl(this.iamStore) === null ? 'unavailable' : 'pending';
  });

  /** Failures are shown only for submissions from this view, never for the Google sign-in that led here. */
  private readonly submitted = signal(false);

  protected readonly errorKey = computed(() =>
    this.submitted() && this.iamStore.error() !== null
      ? registrationErrorKey(this.iamStore.errorCode())
      : null,
  );

  constructor() {
    followAuthenticationContinuation(GOOGLE_REGISTRATION_URL);
  }

  protected submit(): void {
    if (this.iamStore.loading() || !this.iamStore.googleRegistrationRequired()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }
    const { ruc, ...profile } = this.form.getRawValue();
    this.submitted.set(true);
    this.iamStore.completeGoogleOwnerRegistration({ ...profile, ruc: Number(ruc) });
  }

  protected fieldErrorKey(name: CompleteRegistrationControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'iam.validation.required';
    }
    if (control.hasError('pattern')) {
      return PATTERN_ERROR_KEYS[name] ?? null;
    }
    return null;
  }

  private focusFirstInvalidField(): void {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
