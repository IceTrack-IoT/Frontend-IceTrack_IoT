import { Component, computed, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MonitoringStore } from '@monitoring/application/monitoring-store';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';
import { LIVE_STATUS_KEYS } from '@monitoring/presentation/monitoring-feedback';
import {
  ALERT_SEVERITY_APPEARANCE,
  ALERT_TYPE_ICONS,
} from '@monitoring/presentation/monitoring-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * The condition of the last known temperature of an equipment item, most urgent first:
 * - `outside`: the last reading is recent and outside the configured threshold.
 * - `silent`: the server reports the unit silent and no maintenance window covers it.
 * - `within`: the last reading is recent and within the threshold.
 * - `none`: the equipment has never reported.
 */
type TemperatureState = 'outside' | 'silent' | 'within' | 'none';

const STATE_ORDER: Readonly<Record<TemperatureState, number>> = {
  outside: 0,
  silent: 1,
  within: 2,
  none: 3,
};

interface CurrentTemperature {
  readonly equipment: MonitoredEquipment;
  readonly state: TemperatureState;
}

const MAX_RECENT_ALERTS = 4;

/**
 * Monitoring overview of the owner: summary counters, the last known temperature of each monitored
 * equipment item with its freshness, most urgent first, and the active alerts. Readings and alert changes
 * arrive live; the owner can also reload the overview from the backend.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    Icon,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
    RelativeTimePipe,
    TemperaturePipe,
  ],
  selector: 'app-monitoring-dashboard',
  styleUrl: './monitoring-dashboard.css',
  templateUrl: './monitoring-dashboard.html',
})
export class MonitoringDashboard {
  protected readonly store = inject(MonitoringStore);
  protected readonly severityAppearance = ALERT_SEVERITY_APPEARANCE;
  protected readonly typeIcons = ALERT_TYPE_ICONS;
  protected readonly liveStatusKeys = LIVE_STATUS_KEYS;

  protected readonly status = computed<'loading' | 'error' | 'ready'>(() => {
    if (this.store.overviewLoaded()) {
      return 'ready';
    }
    return this.store.overviewFailure() !== null ? 'error' : 'loading';
  });
  /** Deactivated equipment is not monitored. */
  private readonly monitored = computed(() =>
    this.store.equipment().filter((item) => item.status !== 'DEACTIVATED'),
  );
  protected readonly recentAlerts = computed(() =>
    this.store.activeAlerts().slice(0, MAX_RECENT_ALERTS),
  );
  protected readonly temperatures = computed<CurrentTemperature[]>(() =>
    this.monitored()
      .map((equipment) => ({ equipment, state: this.stateOf(equipment) }))
      .sort((first, second) => STATE_ORDER[first.state] - STATE_ORDER[second.state]),
  );

  constructor() {
    this.store.connectLiveUpdates(inject(DestroyRef));
    this.load();
  }

  /** Reads the overview again from the backend. */
  protected load(): void {
    this.store.loadOverview();
  }

  private stateOf(equipment: MonitoredEquipment): TemperatureState {
    const { lastReadingAt, lastKnownTemperature } = equipment;
    if (lastReadingAt === null || lastKnownTemperature === null) {
      return 'none';
    }
    const { connectivity } = equipment;
    if (connectivity.state === 'SILENT' && !connectivity.underMaintenance) {
      return 'silent';
    }
    return lastKnownTemperature < equipment.minCelsius ||
      lastKnownTemperature > equipment.maxCelsius
      ? 'outside'
      : 'within';
  }
}
