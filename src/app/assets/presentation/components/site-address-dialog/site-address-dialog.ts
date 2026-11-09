import { Component, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Site } from '@assets/domain/model/site.entity';
import type { AddressVerificationState } from '@assets/application/assets-store';
import { SiteAddressVerification } from '@assets/presentation/components/site-address-verification/site-address-verification';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Dialog to move a site to another verified address. The site keeps its equipment.
 */
@Component({
  imports: [TranslatePipe, Dialog, Icon, SiteAddressVerification],
  selector: 'app-site-address-dialog',
  templateUrl: './site-address-dialog.html',
})
export class SiteAddressDialog {
  readonly site = input.required<Site>();
  /** Whether the move is in progress. */
  readonly pending = input(false);
  /** The verification of the new address. */
  readonly verification = input.required<AddressVerificationState>();
  /** The translation key of the failure of the last move, if any. */
  readonly errorKey = input<string | null>(null);
  /** Emits when the owner confirms the move to the verified address. */
  readonly confirmed = output<void>();
  readonly verifyAddress = output<string>();
  readonly resetAddress = output<void>();
  readonly closed = output<void>();

  /** Whether the owner tried to save without a verified address. */
  protected readonly addressMissing = signal(false);

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    if (this.verification().verified === null) {
      this.addressMissing.set(true);
      return;
    }
    this.confirmed.emit();
  }

  protected onVerify(address: string): void {
    this.addressMissing.set(false);
    this.verifyAddress.emit(address);
  }
}
