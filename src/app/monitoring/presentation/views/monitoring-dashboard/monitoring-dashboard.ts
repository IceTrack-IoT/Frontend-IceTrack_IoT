import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Alert } from '@monitoring/domain/model/alert.entity';
import { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { AlertStatus } from '@monitoring/domain/value-objects/alert-status';
import {
  createAlertsMock,
  createLatestReadingsMock,
  DASHBOARD_COUNTS,
  MONITORED_EQUIPMENT,
  type MonitoredEquipment,
  STALE_READING_SECONDS,
} from '@monitoring/presentation/mocks/monitoring.mock';
import {
  ALERT_SEVERITY_APPEARANCE,
  ALERT_TYPE_ICONS,
} from '@monitoring/presentation/monitoring-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/** The condition of the current temperature of an equipment item, most urgent first. */
type TemperatureState = 'outside' | 'offline' | 'within' | 'none';

const STATE_ORDER: Readonly<Record<TemperatureState, number>> = {
  outside: 0,
  offline: 1,
  within: 2,
  none: 3,
};

interface CurrentTemperature {
  readonly equipment: MonitoredEquipment;
  readonly reading: SensorReading | null;
  readonly state: TemperatureState;
}

const MAX_RECENT_ALERTS = 4;

/**
 * Monitoring overview of the owner: summary counters, the current temperature of each equipment item
 * with its freshness, most urgent first, and the open alerts. The owner refreshes it manually.
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
  protected readonly source = injectMockDataSource();
  protected readonly counts = DASHBOARD_COUNTS;
  protected readonly severityAppearance = ALERT_SEVERITY_APPEARANCE;
  protected readonly typeIcons = ALERT_TYPE_ICONS;

  private readonly equipment = signal<readonly MonitoredEquipment[]>([]);
  private readonly readings = signal<SensorReading[]>([]);
  private readonly alerts = signal<Alert[]>([]);
  protected readonly updatedAt = signal<Date | null>(null);

  protected readonly monitoredCount = computed(
    () => this.equipment().filter((item) => item.deviceId !== null).length,
  );
  protected readonly openAlerts = computed(() =>
    this.alerts().filter((alert) => alert.status === AlertStatus.OPEN),
  );
  protected readonly criticalCount = computed(
    () => this.openAlerts().filter((alert) => alert.severity === AlertSeverity.CRITICAL).length,
  );
  protected readonly recentAlerts = computed(() => this.openAlerts().slice(0, MAX_RECENT_ALERTS));
  protected readonly equipmentById = computed(
    () => new Map(this.equipment().map((item) => [item.id, item])),
  );
  protected readonly temperatures = computed<CurrentTemperature[]>(() =>
    this.equipment()
      .map((equipment) => {
        const reading =
          this.readings().find((candidate) => candidate.equipment_id === equipment.id) ?? null;
        return { equipment, reading, state: this.stateOf(equipment, reading) };
      })
      .sort((first, second) => STATE_ORDER[first.state] - STATE_ORDER[second.state]),
  );

  constructor() {
    this.load();
  }

  /** Loads the snapshot again; the dashboard has no live stream yet. */
  protected load(): void {
    // TODO: Load the dashboard snapshot through the monitoring store and subscribe to live updates.
    this.source.load((empty) => {
      this.equipment.set(empty ? [] : MONITORED_EQUIPMENT);
      this.readings.set(empty ? [] : createLatestReadingsMock());
      this.alerts.set(empty ? [] : createAlertsMock());
      this.updatedAt.set(new Date());
    });
  }

  private stateOf(equipment: MonitoredEquipment, reading: SensorReading | null): TemperatureState {
    if (reading === null) {
      return 'none';
    }
    if (Date.now() - reading.recorded_at.getTime() > STALE_READING_SECONDS * 1000) {
      return 'offline';
    }
    const value = reading.average_temperature;
    return value < equipment.minCelsius || value > equipment.maxCelsius ? 'outside' : 'within';
  }
}
