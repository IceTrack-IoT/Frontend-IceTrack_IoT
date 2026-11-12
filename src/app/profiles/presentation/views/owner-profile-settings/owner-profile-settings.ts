import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfilesStore } from '@profiles/application/profiles-store';
import { ownerProfileSaveErrorKey } from '@profiles/presentation/profiles-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';
import { SHELL_LIFETIME } from '@shared/presentation/components/private-layout/shell-lifetime';
import { SIGNED_IN_ACCOUNT } from '@shared/presentation/components/private-layout/signed-in-account';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';

/** The states of the section while the owner profile is not shown. */
type OwnerProfileStatus = 'loading' | 'error' | 'not-found' | 'unavailable';

type OwnerProfileControl =
  'fullName' | 'phone' | 'ruc' | 'street' | 'number' | 'city' | 'postalCode' | 'country';

/** A text that holds more than whitespace; the backend rejects blank values. */
const requiredText = [Validators.required, Validators.pattern(/\S/)];

/** Translation keys of the format errors of the fields that validate one. */
const FORMAT_ERROR_KEYS: Partial<Record<OwnerProfileControl, string>> = {
  phone: 'profiles.ownerProfile.validation.phone',
  ruc: 'profiles.ownerProfile.validation.ruc',
};

/**
 * Owner profile section of the settings: the profile bound to the signed-in account (full name, email,
 * phone, address and RUC). The settings view renders it in its outlet.
 *
 * The owner can edit the name, phone, address and RUC; the email belongs to the account and cannot be
 * changed. The form starts from the stored profile, address parts included. A save made from an outdated
 * profile is refused; the current profile is then loaded again and the owner's edits are kept.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Icon, StatePanel],
  selector: 'app-owner-profile-settings',
  styleUrl: './owner-profile-settings.css',
  templateUrl: './owner-profile-settings.html',
})
export class OwnerProfileSettings {
  protected readonly store = inject(ProfilesStore);
  private readonly account = inject(SIGNED_IN_ACCOUNT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly form = inject(NonNullableFormBuilder).group({
    fullName: ['', requiredText],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s()-]{7,20}$/)]],
    ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    street: ['', requiredText],
    number: [''],
    city: ['', requiredText],
    postalCode: ['', requiredText],
    country: ['', requiredText],
  });

  /** The owner profile of the signed-in account; a profile of another account is never shown. */
  protected readonly profile = computed(() => {
    const profile = this.store.ownerProfile();
    return profile !== null && profile.user_id === this.account()?.id ? profile : null;
  });

  protected readonly status = computed<OwnerProfileStatus>(() => {
    if (this.account() === null) {
      return 'unavailable';
    }
    const failure = this.store.ownerProfileFailure();
    if (failure === 'OWNER_NOT_FOUND') {
      return 'not-found';
    }
    return failure !== null && !this.store.ownerProfileLoading() ? 'error' : 'loading';
  });

  protected readonly editing = signal(false);
  protected readonly saveErrorKey = computed(() =>
    ownerProfileSaveErrorKey(this.store.ownerProfileSaveFailure()),
  );

  constructor() {
    this.store.retain(inject(SHELL_LIFETIME));
    this.load();
    // A successful save returns to the profile, which now shows the stored data.
    effect(() => {
      if (this.store.ownerProfileSaved()) {
        this.editing.set(false);
      }
    });
  }

  protected load(): void {
    const account = this.account();
    if (account !== null) {
      this.store.loadOwnerProfile(account.id);
    }
  }

  protected startEditing(): void {
    const profile = this.profile();
    if (profile === null) {
      return;
    }
    this.store.clearOwnerProfileSaveFeedback();
    this.form.reset({
      fullName: profile.full_name,
      phone: profile.phone,
      ruc: String(profile.ruc),
      street: profile.street,
      number: profile.number ?? '',
      city: profile.city,
      postalCode: profile.postal_code,
      country: profile.country,
    });
    this.editing.set(true);
    this.focus('#owner-profile-fullName');
  }

  protected cancelEditing(): void {
    this.store.clearOwnerProfileSaveFeedback();
    this.editing.set(false);
  }

  protected submit(): void {
    if (this.store.ownerProfileSaving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focus('[aria-invalid="true"]');
      return;
    }
    const value = this.form.getRawValue();
    const number = value.number.trim();
    this.store.updateOwnerProfile({
      fullName: value.fullName.trim(),
      phone: value.phone.trim(),
      street: value.street.trim(),
      number: number === '' ? null : number,
      city: value.city.trim(),
      postalCode: value.postalCode.trim(),
      country: value.country.trim(),
      ruc: Number(value.ruc),
    });
  }

  protected fieldErrorKey(name: OwnerProfileControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'shared.validation.required';
    }
    if (control.hasError('pattern')) {
      return FORMAT_ERROR_KEYS[name] ?? 'shared.validation.required';
    }
    return null;
  }

  private focus(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
