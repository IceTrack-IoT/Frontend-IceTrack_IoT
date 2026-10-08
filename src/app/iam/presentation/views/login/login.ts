import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import type { GoogleCredential } from '@iam/application/contracts/google-credential';
import { GoogleSignInButton } from '@iam/presentation/components/google-sign-in-button/google-sign-in-button';
import {
  GOOGLE_SIGN_IN_ERROR_KEY,
  localSignInErrorKey,
} from '@iam/presentation/authentication-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';

type LoginControl = 'username' | 'password';

@Component({
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PublicLayout, GoogleSignInButton, Icon],
  selector: 'app-login',
  styleUrls: ['../../styles/iam-card.css', '../../styles/iam-form.css', './login.css'],
  templateUrl: './login.html',
})
export class Login {
  protected readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly passwordVisible = signal(false);
  private readonly signInMethod = signal<'local' | 'google'>('local');

  /**
   * The translation key of the sign-in failure. An unregistered Google account is not a failure here:
   * it continues to the Google registration.
   */
  protected readonly errorKey = computed(() => {
    if (this.iamStore.error() === null || this.iamStore.googleRegistrationRequired()) {
      return null;
    }
    return this.signInMethod() === 'google'
      ? GOOGLE_SIGN_IN_ERROR_KEY
      : localSignInErrorKey(this.iamStore.errorCode());
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
  }

  protected submit(): void {
    if (this.iamStore.loading()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.signInMethod.set('local');
    this.iamStore.signInLocally(this.form.getRawValue());
  }

  protected signInWithGoogle(credential: GoogleCredential): void {
    this.signInMethod.set('google');
    this.iamStore.signInWithGoogle(credential);
  }

  protected showError(name: LoginControl): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected describedBy(name: LoginControl): string | null {
    const ids = [
      this.showError(name) ? `login-${name}-error` : null,
      this.errorKey() === null ? null : 'login-error',
    ].filter((id) => id !== null);
    return ids.length > 0 ? ids.join(' ') : null;
  }
}
