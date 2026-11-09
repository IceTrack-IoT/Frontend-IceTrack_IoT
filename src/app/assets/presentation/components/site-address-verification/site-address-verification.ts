import { Component, computed, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SITE_ADDRESS_MAX_LENGTH } from '@assets/application/contracts/site-registration';
import type { AddressVerificationState } from '@assets/application/assets-store';
import { addressVerificationErrorKey } from '@assets/presentation/assets-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';

let nextVerificationId = 0;

/**
 * Address field of a site that the backend verifies before the site is saved. The owner types an address
 * and asks to verify it; the verified, normalized address replaces the field, and an address that was not
 * verified offers the suggested candidates. Verifying saves nothing.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Icon],
  selector: 'app-site-address-verification',
  styleUrl: './site-address-verification.css',
  templateUrl: './site-address-verification.html',
})
export class SiteAddressVerification {
  /** The state of the verification, owned by the parent. */
  readonly verification = input.required<AddressVerificationState>();
  /** Whether to tell the owner that a verified address is still missing. */
  readonly showMissing = input(false);
  /** Whether the form this field belongs to is being saved. */
  readonly disabled = input(false);
  /** Emits the address the owner asks to verify. */
  readonly verify = output<string>();
  /** Emits when the owner discards the verified address to type another one. */
  readonly reset = output<void>();

  protected readonly id = `site-address-${nextVerificationId++}`;
  protected readonly maxLength = SITE_ADDRESS_MAX_LENGTH;
  protected readonly address = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(SITE_ADDRESS_MAX_LENGTH)],
  });

  protected readonly verifying = computed(() => this.verification().status === 'verifying');
  protected readonly failureKey = computed(() => {
    const failure = this.verification().failure;
    return failure === null ? null : addressVerificationErrorKey(failure);
  });

  protected submit(): void {
    if (this.verifying() || this.disabled()) {
      return;
    }
    if (this.address.invalid) {
      this.address.markAsTouched();
      return;
    }
    this.verify.emit(this.address.value);
  }

  protected pickCandidate(candidate: string): void {
    this.address.setValue(candidate);
    this.submit();
  }

  protected fieldErrorKey(): string | null {
    if (this.address.touched && this.address.hasError('required')) {
      return 'shared.validation.required';
    }
    if (this.address.hasError('maxlength')) {
      return 'shared.validation.tooLong';
    }
    return this.showMissing() && this.verification().status !== 'verifying'
      ? 'assets.addressVerification.required'
      : null;
  }
}
