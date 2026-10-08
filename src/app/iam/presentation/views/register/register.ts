import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import { GoogleSignInButton } from '@iam/presentation/components/google-sign-in-button/google-sign-in-button';
import {
  GOOGLE_SIGN_IN_ERROR_KEY,
  registrationErrorKey,
} from '@iam/presentation/authentication-feedback';
import { phoneValidators, rucValidators } from '@iam/presentation/owner-registration-validators';
import { Icon } from '@shared/presentation/components/icon/icon';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';

const PASSWORD_MIN_LENGTH = 8;

type RegisterControl =
  | 'fullName'
  | 'username'
  | 'email'
  | 'phone'
  | 'ruc'
  | 'street'
  | 'number'
  | 'city'
  | 'postalCode'
  | 'country'
  | 'password'
  | 'confirmPassword';

/** Translation keys of the `pattern` error of the fields that validate a format. */
const PATTERN_ERROR_KEYS: Partial<Record<RegisterControl, string>> = {
  phone: 'iam.validation.phone',
  ruc: 'iam.validation.ruc',
};

const passwordsMatch: ValidatorFn = (group) => {
  const password: unknown = group.get('password')?.value;
  const confirmation: unknown = group.get('confirmPassword')?.value;
  return confirmation === '' || confirmation === password ? null : { passwordMismatch: true };
};

/**
 * Local registration of a business owner. The backend assigns the owner role; registration does not
 * start a session, so a successful sign-up invites the owner to sign in.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PublicLayout, GoogleSignInButton, Icon],
  selector: 'app-register',
  styleUrls: ['../../styles/iam-card.css', '../../styles/iam-form.css', './register.css'],
  templateUrl: './register.html',
})
export class Register {
  protected readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group(
    {
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', phoneValidators],
      ruc: ['', rucValidators],
      street: ['', Validators.required],
      number: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  private readonly attempt = signal<'sign-up' | 'google'>('sign-up');
  private readonly successHeading = viewChild<ElementRef<HTMLElement>>('successHeading');

  /**
   * The translation key of the registration failure. An unregistered Google account is not a failure
   * here: it continues to the Google registration.
   */
  protected readonly errorKey = computed(() => {
    if (this.iamStore.error() === null || this.iamStore.googleRegistrationRequired()) {
      return null;
    }
    return this.attempt() === 'google'
      ? GOOGLE_SIGN_IN_ERROR_KEY
      : registrationErrorKey(this.iamStore.errorCode());
  });

  constructor() {
    this.iamStore.clearFeedback();
    effect(() => {
      if (this.iamStore.isAuthenticated()) {
        void this.router.navigateByUrl('/');
      } else if (this.iamStore.googleRegistrationRequired()) {
        void this.router.navigateByUrl('/iam/complete-google-registration');
      }
    });
    // The credentials are not needed once the account exists; drop them from memory.
    effect(() => {
      if (this.iamStore.registeredUser() !== null) {
        this.form.reset();
      }
    });
    // The form is replaced by the success state, so focus moves to its heading.
    afterRenderEffect(() => this.successHeading()?.nativeElement.focus());
  }

  protected submit(): void {
    if (this.iamStore.loading()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }
    const value = this.form.getRawValue();
    this.attempt.set('sign-up');
    this.iamStore.signUpOwner({
      username: value.username,
      password: value.password,
      email: value.email,
      fullName: value.fullName,
      phone: value.phone,
      street: value.street,
      number: value.number,
      city: value.city,
      postalCode: value.postalCode,
      country: value.country,
      ruc: Number(value.ruc),
    });
  }

  protected signUpWithGoogle(credential: GoogleCredential): void {
    this.attempt.set('google');
    this.iamStore.signInWithGoogle(credential);
  }

  protected fieldErrorKey(name: RegisterControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'iam.validation.required';
    }
    if (control.hasError('email')) {
      return 'iam.validation.email';
    }
    if (control.hasError('minlength')) {
      return 'iam.validation.passwordLength';
    }
    if (control.hasError('pattern')) {
      return PATTERN_ERROR_KEYS[name] ?? null;
    }
    if (name === 'confirmPassword' && this.form.hasError('passwordMismatch')) {
      return 'iam.validation.passwordMismatch';
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
