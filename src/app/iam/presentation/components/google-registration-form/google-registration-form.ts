import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IamStore } from '@iam/application/iam-store';

type AccountType = 'owner' | 'technician';

/**
 * Onboarding form that completes the pending Google registration as an owner or a technician.
 */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-google-registration-form',
  templateUrl: './google-registration-form.html',
})
export class GoogleRegistrationForm {
  protected readonly iamStore = inject(IamStore);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group({
    accountType: this.formBuilder.control<AccountType>('owner'),
    phone: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['', Validators.required],
    owner: this.formBuilder.group({
      ruc: this.formBuilder.control<number | null>(null, [
        Validators.required,
        Validators.pattern(/^\d{11}$/),
      ]),
    }),
    technician: this.formBuilder.group({
      speciality: ['', Validators.required],
      certificationNumber: ['', Validators.required],
    }),
  });

  protected readonly accountType = toSignal(this.form.controls.accountType.valueChanges, {
    initialValue: this.form.controls.accountType.value,
  });

  constructor() {
    effect(() => {
      const { owner, technician } = this.form.controls;
      if (this.accountType() === 'owner') {
        owner.enable();
        technician.disable();
      } else {
        owner.disable();
        technician.enable();
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    const { accountType, owner, technician, ...profile } = this.form.getRawValue();
    if (accountType === 'technician') {
      this.iamStore.completeGoogleTechnicianRegistration({ ...profile, ...technician });
    } else if (owner.ruc !== null) {
      this.iamStore.completeGoogleOwnerRegistration({ ...profile, ruc: owner.ruc });
    }
  }
}
