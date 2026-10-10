import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';
import { CardType } from '@profiles/domain/value-objects/card-type';
import { ActiveOrdersCard } from '@profiles/presentation/components/active-orders-card/active-orders-card';
import {
  DashboardCustomizeDialog,
  type DashboardLayoutChange,
} from '@profiles/presentation/components/dashboard-customize-dialog/dashboard-customize-dialog';
import { EquipmentStatusCard } from '@profiles/presentation/components/equipment-status-card/equipment-status-card';
import { MonitoredEquipmentCard } from '@profiles/presentation/components/monitored-equipment-card/monitored-equipment-card';
import { OpenAlertsCard } from '@profiles/presentation/components/open-alerts-card/open-alerts-card';
import {
  type ActiveOrderSummary,
  createActiveOrdersMock,
  createDashboardConfigMock,
  createEquipmentSnapshotsMock,
  createOpenAlertsMock,
  DASHBOARD_SITES,
  type EquipmentSnapshot,
  type OpenAlertSummary,
} from '@profiles/presentation/mocks/dashboard.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Owner dashboard: the cards of the owner's dashboard configuration that are visible, in their configured
 * order, scoped to a site (the default site of the configuration at first). Profiles owns the card
 * layout and the defaults; the cards show data that the other contexts own. The owner rearranges the
 * cards and changes the defaults in the customize dialog.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ActiveOrdersCard,
    DashboardCustomizeDialog,
    EquipmentStatusCard,
    Icon,
    MonitoredEquipmentCard,
    OpenAlertsCard,
    StatePanel,
    LocalizedDatePipe,
    TemperaturePipe,
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly source = injectMockDataSource();
  protected readonly cardTypes = CardType;
  protected readonly sites = DASHBOARD_SITES;
  protected readonly today = new Date();

  /** The site the dashboard is scoped to, or null for every site. */
  protected readonly scope = new FormControl<number | null>(null);
  protected readonly scopeValue = toSignal(this.scope.valueChanges, { initialValue: null });

  protected readonly config = signal<DashboardConfig | null>(null);
  private readonly equipment = signal<EquipmentSnapshot[]>([]);
  private readonly alerts = signal<OpenAlertSummary[]>([]);
  private readonly orders = signal<ActiveOrderSummary[]>([]);
  protected readonly customizing = signal(false);
  /** The translation key of the outcome of the last save, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  protected readonly visibleCards = computed(() =>
    [...(this.config()?.cards ?? [])]
      .filter((card) => card.is_visible)
      .sort((first, second) => first.order - second.order),
  );
  protected readonly scopeName = computed(
    () => this.sites.find((site) => site.id === this.scopeValue())?.name ?? null,
  );
  protected readonly scopedEquipment = computed(() => this.inScope(this.equipment()));
  protected readonly scopedAlerts = computed(() => this.inScope(this.alerts()));
  protected readonly scopedOrders = computed(() => this.inScope(this.orders()));

  constructor() {
    this.load();
  }

  protected load(): void {
    // TODO: Read the configuration from the ProfilesStore and the card data from the owning contexts.
    this.source.load((empty) => {
      const config = createDashboardConfigMock();
      this.config.set(config);
      this.scope.setValue(config.default_site_id);
      this.equipment.set(empty ? [] : createEquipmentSnapshotsMock());
      this.alerts.set(empty ? [] : createOpenAlertsMock());
      this.orders.set(empty ? [] : createActiveOrdersMock());
    });
  }

  protected openCustomize(): void {
    this.announcement.set(null);
    this.customizing.set(true);
  }

  protected saveLayout(change: DashboardLayoutChange): void {
    const config = this.config();
    if (!config) {
      return;
    }
    // TODO: Delegate to the ProfilesStore (update dashboard layout and defaults).
    this.source.mutate(() => {
      this.config.set(
        new DashboardConfig({
          id: config.id,
          user_id: config.user_id,
          default_site_id: change.defaultSiteId,
          default_temperature_range: change.defaultTemperatureRange,
          cards: change.cards,
        }),
      );
      this.scope.setValue(change.defaultSiteId);
      this.customizing.set(false);
      this.announcement.set('profiles.dashboard.saved');
    });
  }

  private inScope<T extends { readonly siteId: number }>(items: readonly T[]): T[] {
    const siteId = this.scopeValue();
    return items.filter((item) => siteId === null || item.siteId === siteId);
  }
}
