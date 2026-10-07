import { Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IamStore } from '@iam/application/iam-store';
import { GoogleSignInButton } from '@iam/presentation/components/google-sign-in-button/google-sign-in-button';
import { GoogleRegistrationForm } from '@iam/presentation/components/google-registration-form/google-registration-form';

@Component({
  imports: [ReactiveFormsModule, RouterLink, GoogleSignInButton, GoogleRegistrationForm],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  protected readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    this.iamStore.clearFeedback();
    effect(() => {
      if (this.iamStore.isAuthenticated()) {
        void this.router.navigateByUrl('/home');
      }
    });
  }

  protected submit(): void {
    if (this.form.valid) {
      this.iamStore.signInLocally(this.form.getRawValue());
    }
  }
}
