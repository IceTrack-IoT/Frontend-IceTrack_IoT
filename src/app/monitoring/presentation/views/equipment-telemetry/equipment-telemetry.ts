import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { interval, map } from 'rxjs';
import {
  DEFAULT_MISSED_SYNC_WINDOWS_FOR_OFFLINE,
  offlineAfterSeconds,
} from '@monitoring/domain/model/alert-policy.entity';
import type { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { AlertType } from '@monitoring/domain/value-objects/alert-type';
import { MonitoringStore } from '@monitoring/application/monitoring-store';
import type { MonitoredEquipment } from '@monitoring/application/contracts/monitored-equipment';
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

/** How often the freshness of the last reading is re-evaluated. */
const CLOCK_TICK_MS = 15_000;

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
  private readonly now = toSignal(interval(CLOCK_TICK_MS).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

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
  /** Seconds without a reading after which the unit is considered offline, from its policy. */
  protected readonly offlineSeconds = computed(() =>
    offlineAfterSeconds(
      this.store.telemetryPolicy()?.missed_sync_windows_for_offline ??
        DEFAULT_MISSED_SYNC_WINDOWS_FOR_OFFLINE,
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
  protected readonly stale = computed(() => {
    const lastReadingAt = this.equipment()?.lastReadingAt ?? null;
    return (
      lastReadingAt !== null && this.now() - lastReadingAt.getTime() > this.offlineSeconds() * 1000
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
    const readings = this.history();
    const equipment = this.equipment();
    if (readings.length === 0 || !equipment) {
      return null;
    }
    const averages = readings.map((reading) => reading.avg_temperature);
    return {
      min: Math.min(...readings.map((reading) => reading.min_temperature)),
      max: Math.max(...readings.map((reading) => reading.max_temperature)),
      mean: averages.reduce((total, value) => total + value, 0) / averages.length,
      outside: readings.filter((reading) => this.isOutside(reading, equipment)).length,
      count: readings.length,
      from: readings[0].recorded_at,
      to: readings[readings.length - 1].recorded_at,
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

  protected isOutside(reading: SensorReading, equipment: MonitoredEquipment): boolean {
    return this.isOutsideValue(reading.avg_temperature, equipment);
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
