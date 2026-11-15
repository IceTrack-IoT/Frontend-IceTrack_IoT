import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Site } from '@assets/domain/model/site.entity';
import { GeocodingStatus } from '@assets/domain/value-objects/geocoding-status';
import type { SiteDetails } from '@assets/application/contracts/site-registration';
import { AssetsStore } from '@assets/application/assets-store';
import {
  geocodingHintKey,
  geocodingRetryErrorKey,
  geocodingRetryOutcomeKey,
  SITE_ACTION_SUCCESS_KEYS,
  siteActionErrorKey,
} from '@assets/presentation/assets-feedback';
import { SiteAddressDialog } from '@assets/presentation/components/site-address-dialog/site-address-dialog';
import { SiteFormDialog } from '@assets/presentation/components/site-form-dialog/site-form-dialog';
import { Icon } from '@shared/presentation/components/icon/icon';
import { SHELL_LIFETIME } from '@shared/presentation/components/private-layout/shell-lifetime';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';

/** The site dialog being shown: register a site, edit a site, or move a site to another address. */
type SiteDialog =
  | { readonly kind: 'form'; readonly site: Site | null }
  | { readonly kind: 'address'; readonly site: Site };

/** The asynchronous states of the site list while it is not populated. */
type ListStatus = 'loading' | 'error' | 'ready';

/**
 * Sites of the owner with their address, contact and equipment count. The owner registers sites at a
 * verified address, edits their name and contact, moves them to another verified address, and opens the
 * equipment of a site from here. A site that is not located on the map says why, and the owner can have
 * its address looked up again.
 */
@Component({
  imports: [RouterLink, TranslatePipe, Icon, StatePanel, SiteFormDialog, SiteAddressDialog],
  selector: 'app-site-list',
  styleUrl: './site-list.css',
  templateUrl: './site-list.html',
})
export class SiteList {
  protected readonly store = inject(AssetsStore);
  protected readonly dialog = signal<SiteDialog | null>(null);

  /** Sites already in memory stay shown while they are refreshed. */
  protected readonly status = computed<ListStatus>(() => {
    if (this.store.sitesLoaded()) {
      return 'ready';
    }
    return this.store.sitesFailure() === null ? 'loading' : 'error';
  });
  /** The confirmation of the last site action, announced once its dialog is closed. */
  protected readonly announcement = computed(() => {
    const state = this.store.siteActionState();
    return this.dialog() === null && state?.status === 'succeeded'
      ? SITE_ACTION_SUCCESS_KEYS[state.action]
      : null;
  });
  /** The failure of the last site action, shown in its dialog. */
  protected readonly dialogErrorKey = computed(() => {
    const state = this.store.siteActionState();
    return state?.status === 'failed' && state.failure !== null
      ? siteActionErrorKey(state.failure)
      : null;
  });

  /** The outcome of the last location lookup, shown on the card of its site. */
  protected readonly geocodingFeedback = computed(() => {
    const retry = this.store.geocodingRetry();
    if (retry === null || retry.status === 'pending') {
      return null;
    }
    return retry.status === 'succeeded'
      ? { siteId: retry.siteId, tone: 'success', key: geocodingRetryOutcomeKey(retry.outcome) }
      : {
          siteId: retry.siteId,
          tone: 'critical',
          key: geocodingRetryErrorKey(retry.failure ?? 'UNEXPECTED'),
        };
  });

  protected readonly geocodingHintKey = (site: Site): string | null =>
    geocodingHintKey(site.geocoding_status, site.geocoding_failure_reason);

  protected readonly geocodingPending = (site: Site): boolean =>
    site.geocoding_status === GeocodingStatus.PENDING;

  constructor() {
    this.store.retain(inject(SHELL_LIFETIME));
    this.store.clearSiteActionState();
    this.store.clearGeocodingRetry();
    this.store.loadSites();

    // A successful action closes its dialog.
    effect(() => {
      if (this.store.siteActionState()?.status === 'succeeded') {
        untracked(() => this.dialog.set(null));
      }
    });
  }

  protected load(): void {
    this.store.loadSites();
  }

  protected retryGeocoding(site: Site): void {
    this.store.retrySiteGeocoding(site.id);
  }

  protected retryingGeocoding(site: Site): boolean {
    const retry = this.store.geocodingRetry();
    return retry?.status === 'pending' && retry.siteId === site.id;
  }

  protected openForm(site: Site | null): void {
    this.store.clearSiteActionState();
    this.dialog.set({ kind: 'form', site });
  }

  protected openAddress(site: Site): void {
    this.store.clearSiteActionState();
    this.dialog.set({ kind: 'address', site });
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    if (this.store.siteActionState()?.status !== 'succeeded') {
      this.store.clearSiteActionState();
    }
  }

  protected save(site: Site | null, details: SiteDetails): void {
    if (site === null) {
      this.store.registerSite(details);
    } else {
      this.store.updateSite(site.id, details);
    }
  }
}
