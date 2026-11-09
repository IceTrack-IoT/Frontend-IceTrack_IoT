import { Component, inject, input, type OnInit, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Site } from '@assets/domain/model/site.entity';
import {
  SITE_CONTACT_NAME_MAX_LENGTH,
  SITE_NAME_MAX_LENGTH,
  SITE_PHONE_PATTERN,
  type SiteDetails,
} from '@assets/application/contracts/site-registration';
import type { AddressVerificationState } from '@assets/application/assets-store';
import { SiteAddressVerification } from '@assets/presentation/components/site-address-verification/site-address-verification';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';

type SiteFormControl = keyof SiteDetails;

/**
 * Dialog to register a site at a verified address, or to update the name and contact of an existing one.
 * The address of an existing site only changes through its own verified-address dialog.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, Icon, SiteAddressVerification],
  selector: 'app-site-form-dialog',
  templateUrl: './site-form-dialog.html',
})
export class SiteFormDialog implements OnInit {
  /** The site to update, or null to register a new site. */
  readonly site = input<Site | null>(null);
  /** Whether the save is in progress. */
  readonly pending = input(false);
  /** The verification of the address of a new site. */
  readonly verification = input.required<AddressVerificationState>();
  /** The translation key of the failure of the last save, if any. */
  readonly errorKey = input<string | null>(null);
  readonly saved = output<SiteDetails>();
  readonly verifyAddress = output<string>();
  readonly resetAddress = output<void>();
  readonly closed = output<void>();

  protected readonly nameMaxLength = SITE_NAME_MAX_LENGTH;
  protected readonly contactNameMaxLength = SITE_CONTACT_NAME_MAX_LENGTH;
  /** Whether the owner tried to register the site without a verified address. */
  protected readonly addressMissing = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(SITE_NAME_MAX_LENGTH)]],
    contactName: ['', [Validators.required, Validators.maxLength(SITE_CONTACT_NAME_MAX_LENGTH)]],
    phone: ['', [Validators.required, Validators.pattern(SITE_PHONE_PATTERN)]],
  });

  ngOnInit(): void {
    const site = this.site();
    if (site) {
      this.form.setValue({
        name: site.name,
        contactName: site.contact_name,
        phone: site.phone.value,
      });
    }
  }

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    const needsAddress = this.site() === null && this.verification().verified === null;
    this.addressMissing.set(needsAddress);
    if (this.form.invalid || needsAddress) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }

  protected onVerify(address: string): void {
    this.addressMissing.set(false);
    this.verifyAddress.emit(address);
  }

  protected fieldErrorKey(name: SiteFormControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required')) {
      return 'shared.validation.required';
    }
    if (control.hasError('maxlength')) {
      return 'shared.validation.tooLong';
    }
    return control.hasError('pattern') ? 'assets.validation.phone' : null;
  }
}
