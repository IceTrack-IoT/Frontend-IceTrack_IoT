import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';
import { MonitoringStore } from '@monitoring/application/monitoring-store';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';
import type { TelemetryPoint } from '@monitoring/application/contracts/telemetry-history';
import {
  type ExcursionPeriod,
  TemperatureChart,
} from '@monitoring/presentation/components/temperature-chart/temperature-chart';
import { LIVE_STATUS_KEYS } from '@monitoring/presentation/monitoring-feedback';
import {
  TELEMETRY_RANGE_WINDOWS,
  TELEMETRY_RANGES,
  type TelemetryRange,
} from '@monitoring/presentation/telemetry-range';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Current and historical telemetry of an equipment item: the last known reading and its freshness, the
 * reading history of a selected period as a chart and a table, with the excursion periods of its active
 * temperature alerts, and the alert policy that applies. Readings arrive live while the view is open.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    Icon,
    StatePanel,
    TemperatureChart,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    RelativeTimePipe,
    TemperaturePipe,
  ],
  selector: 'app-equipment-telemetry',
  styleUrl: './equipment-telemetry.css',
  templateUrl: './equipment-telemetry.html',
})
export class EquipmentTelemetry {
  protected readonly store = inject(MonitoringStore);
  protected readonly ranges = TELEMETRY_RANGES;
  protected readonly liveStatusKeys = LIVE_STATUS_KEYS;

  private readonly equipmentId = signal(0);
  protected readonly range = signal<TelemetryRange>('2H');
  protected readonly window = computed(() => TELEMETRY_RANGE_WINDOWS[this.range()]);
  /** Whether the readings table is open; it is only rendered then, as a long period has many rows. */
  protected readonly tableOpen = signal(false);

  protected readonly equipment = computed(() => {
    const equipment = this.store.telemetryEquipment();
    return equipment?.id === this.equipmentId() ? equipment : null;
  });
  protected readonly status = computed<'loading' | 'error' | 'not-found' | 'ready'>(() => {
    if (this.equipment() !== null) {
      return 'ready';
    }
    switch (this.store.telemetryFailure()) {
      case null:
        return 'loading';
      case 'NOT_FOUND':
      case 'ACCESS_DENIED':
        return 'not-found';
      default:
        return 'error';
    }
  });
  protected readonly history = computed(() => this.store.history() ?? []);
  /**
   * The time between two points beyond which the chart shows a gap: the silence window of the unit, or
   * the bucket width when the history is aggregated.
   */
  protected readonly gapSeconds = computed(() =>
    Math.max(
      this.equipment()?.connectivity.silentAfterSeconds ?? 0,
      this.store.historyBucketSeconds() ?? 0,
    ),
  );
  /** The latest reading batch, when it is the last one the equipment reported. */
  protected readonly latestReading = computed(() => {
    const reading = this.store.latestReading();
    const lastReadingAt = this.equipment()?.lastReadingAt ?? null;
    return reading !== null &&
      lastReadingAt !== null &&
      reading.recorded_at.getTime() === lastReadingAt.getTime()
      ? reading
      : null;
  });
  /** Whether the server reports the unit silent outside a maintenance window, where silence is expected. */
  protected readonly stale = computed(() => {
    const connectivity = this.equipment()?.connectivity ?? null;
    return (
      connectivity !== null && connectivity.state === 'SILENT' && !connectivity.underMaintenance
    );
  });
  protected readonly outside = computed(() => {
    const equipment = this.equipment();
    const temperature = equipment?.lastKnownTemperature ?? null;
    return (
      equipment !== null && temperature !== null && this.isOutsideValue(temperature, equipment)
    );
  });
  /** The periods of the active temperature excursion alerts, as the backend reports them. */
  protected readonly excursions = computed<ExcursionPeriod[]>(() =>
    this.store
      .telemetryActiveAlerts()
      .filter((alert) => alert.type === AlertType.TEMPERATURE_EXCURSION)
      .map((alert) => ({ from: alert.opened_at, to: null })),
  );
  protected readonly excursionSince = computed(() => {
    const starts = this.excursions().map((period) => period.from.getTime());
    return starts.length === 0 ? null : new Date(Math.min(...starts));
  });
  protected readonly stats = computed(() => {
    const points = this.history();
    const equipment = this.equipment();
    if (points.length === 0 || !equipment) {
      return null;
    }
    const averages = points.map((point) => point.avgTemperature);
    return {
      min: Math.min(...points.map((point) => point.minTemperature)),
      max: Math.max(...points.map((point) => point.maxTemperature)),
      mean: averages.reduce((total, value) => total + value, 0) / averages.length,
      outside: points.filter((point) => this.isOutside(point, equipment)).length,
      count: points.length,
      from: points[0].at,
      to: points[points.length - 1].at,
    };
  });

  constructor() {
    this.store.connectLiveUpdates(inject(DestroyRef));
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.equipmentId.set(Number(params.get('equipmentId')));
        this.load();
      });
  }

  protected isOutside(point: TelemetryPoint, equipment: MonitoredEquipment): boolean {
    return this.isOutsideValue(point.avgTemperature, equipment);
  }

  protected load(): void {
    this.store.loadEquipmentTelemetry(this.equipmentId());
    this.loadHistory();
  }

  protected selectRange(range: TelemetryRange): void {
    this.range.set(range);
    this.loadHistory();
  }

  protected loadHistory(): void {
    this.store.loadReadingHistory(this.equipmentId(), this.window().durationMinutes);
  }

  protected toggleTable(event: Event): void {
    if (event.target instanceof HTMLDetailsElement) {
      this.tableOpen.set(event.target.open);
    }
  }

  private isOutsideValue(temperature: number, equipment: MonitoredEquipment): boolean {
    return temperature < equipment.minCelsius || temperature > equipment.maxCelsius;
  }
}
