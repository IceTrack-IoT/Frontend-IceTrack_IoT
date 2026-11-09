import { NgOptimizedImage } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
 * Landing of technicians: the web platform is owner-only, so it only points to the mobile application.
 * It renders no owner shell or owner data. The web channel normally refuses technician sign-ins without
 * issuing a session, so the view then offers to return to sign-in; a technician session, if one exists,
 * is offered a sign-out instead.
 */
@Component({
  imports: [NgOptimizedImage, RouterLink, TranslatePipe, PublicLayout, Icon],
  selector: 'app-technician-redirect',
  styleUrls: ['../../styles/iam-card.css', './technician-redirect.css'],
  templateUrl: './technician-redirect.html',
})
export class TechnicianRedirect {
  protected readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly qrCodePath = MOBILE_APP_QR_CODE_PATH;
  protected readonly qrCodeUnavailable = signal(false);

  protected signOut(): void {
    this.iamStore.signOut();
    void this.router.navigateByUrl('/iam/login');
  }
}
