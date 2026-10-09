import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Site } from '@assets/domain/model/site.entity';
import {
  SiteFormDialog,
  type SiteFormValue,
} from '@assets/presentation/components/site-form-dialog/site-form-dialog';
import { createSitesMock, MOCK_OWNER_ID } from '@assets/presentation/mocks/assets.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';

/** The site form being shown: a new site, or the site being updated. */
type SiteFormTarget = { readonly site: Site | null };

/**
 * Sites of the owner with their contact and equipment count. The owner registers sites and updates their
 * contact from here, and opens the equipment of a site.
 */
@Component({
  imports: [RouterLink, TranslatePipe, Icon, StatePanel, SiteFormDialog],
  selector: 'app-site-list',
  styleUrl: './site-list.css',
  templateUrl: './site-list.html',
})
export class SiteList {
  protected readonly source = injectMockDataSource();
  protected readonly sites = signal<Site[]>([]);
  protected readonly formTarget = signal<SiteFormTarget | null>(null);
  /** The translation key of the outcome of the last save, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  protected readonly equipmentTotal = computed(() =>
    this.sites().reduce((total, site) => total + site.equipment_count, 0),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.source.load((empty) => this.sites.set(empty ? [] : createSitesMock()));
  }

  protected openForm(site: Site | null): void {
    this.announcement.set(null);
    this.formTarget.set({ site });
  }

  protected save(value: SiteFormValue): void {
    const site = this.formTarget()?.site ?? null;
    // TODO: Delegate to the assets store (register site / update site contact use cases).
    this.source.mutate(() => {
      if (site) {
        site.contact_name = value.contactName;
        site.phone = { value: value.phone };
        this.sites.update((sites) => [...sites]);
        this.announcement.set('assets.siteList.updated');
      } else {
        const id = Math.max(0, ...this.sites().map((existing) => existing.id)) + 1;
        const created = new Site({
          id,
          owner_id: MOCK_OWNER_ID,
          name: value.name,
          address: value.address,
          contact_name: value.contactName,
          phone: { value: value.phone },
          equipment_count: 0,
        });
        this.sites.update((sites) => [...sites, created]);
        this.announcement.set('assets.siteList.registered');
      }
      this.formTarget.set(null);
    });
  }
}
