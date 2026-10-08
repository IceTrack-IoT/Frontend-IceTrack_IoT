import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import { ROLE_LANDING_URLS, type RoleLanding, roleLandingOf } from '@iam/presentation/role-landing';
import { Icon } from '@shared/presentation/components/icon/icon';
import { PublicLayout } from '@shared/presentation/components/public-layout/public-layout';

/**
 * Shown when the user may not access the requested part of the platform. It offers the way out that
 * matches the session: the landing of the user's role, sign-in when there is no session, or sign-out
 * when the role is not supported by the web platform.
 */
@Component({
  imports: [RouterLink, TranslatePipe, PublicLayout, Icon],
  selector: 'app-unauthorized',
  styleUrls: ['../../styles/iam-card.css', './unauthorized.css'],
  templateUrl: './unauthorized.html',
})
export class Unauthorized {
  private readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly landingUrls = ROLE_LANDING_URLS;

  protected readonly exit = computed<RoleLanding | 'restoring' | 'signed-out'>(() => {
    if (this.iamStore.restoring()) {
      return 'restoring';
    }
    const user = this.iamStore.currentUser();
    return user === null ? 'signed-out' : roleLandingOf(user.role);
  });

  protected signOut(): void {
    this.iamStore.signOut();
    void this.router.navigateByUrl('/iam/login');
  }
}
