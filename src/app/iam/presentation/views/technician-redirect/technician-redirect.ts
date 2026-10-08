import { NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import { Icon } from '@shared/presentation/components/icon/icon';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';

/**
 * Approved QR code of the IceTrack mobile distribution URL.
 * TODO: Placeholder path; add the approved QR code image at `public/assets/images/mobile-app-qr.png`.
 */
const MOBILE_APP_QR_CODE_PATH = 'assets/images/mobile-app-qr.png';

/**
 * Landing of authenticated technicians: the web platform is owner-only, so it only points to the mobile
 * application and offers to sign out. It renders no owner shell or owner data.
 */
@Component({
  imports: [NgOptimizedImage, TranslatePipe, PublicLayout, Icon],
  selector: 'app-technician-redirect',
  styleUrls: ['../../styles/iam-card.css', './technician-redirect.css'],
  templateUrl: './technician-redirect.html',
})
export class TechnicianRedirect {
  private readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly qrCodePath = MOBILE_APP_QR_CODE_PATH;
  protected readonly qrCodeUnavailable = signal(false);

  protected signOut(): void {
    this.iamStore.signOut();
    void this.router.navigateByUrl('/iam/login');
  }
}
