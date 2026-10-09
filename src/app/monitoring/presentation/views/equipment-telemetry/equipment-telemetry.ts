import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';
import { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import { TemperatureChart } from '@monitoring/presentation/components/temperature-chart/temperature-chart';
import {
  createAlertPoliciesMock,
  createLatestReadingsMock,
  createTelemetryMock,
  MONITORED_EQUIPMENT,
  type MonitoredEquipment,
  STALE_READING_SECONDS,
} from '@monitoring/presentation/mocks/monitoring.mock';
import {
  TELEMETRY_RANGE_WINDOWS,
  TELEMETRY_RANGES,
  type TelemetryRange,
} from '@monitoring/presentation/telemetry-range';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Current and historical telemetry of an equipment item: the latest reading and its freshness, the
 * temperature history of a selected period as a chart and a table, and the alert policy that applies.
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
  protected readonly source = injectMockDataSource();
  protected readonly ranges = TELEMETRY_RANGES;

  protected readonly equipment = signal<MonitoredEquipment | null>(null);
  protected readonly latest = signal<SensorReading | null>(null);
  protected readonly policy = signal<AlertPolicy | null>(null);
  protected readonly range = signal<TelemetryRange>('2H');
  protected readonly window = computed(() => TELEMETRY_RANGE_WINDOWS[this.range()]);

  /**
   * The history of the selected period.
   * TODO: Load the history of the selected period through the monitoring store.
   */
  protected readonly history = computed(() => {
    const equipment = this.equipment();
    const { durationMinutes, intervalMinutes } = this.window();
    return equipment && !this.source.forcedEmpty
      ? createTelemetryMock(equipment.id, durationMinutes, intervalMinutes)
      : [];
  });
  protected readonly stats = computed(() => {
    const readings = this.history();
    const equipment = this.equipment();
    if (readings.length === 0 || !equipment) {
      return null;
    }
    const averages = readings.map((reading) => reading.average_temperature);
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
  protected readonly stale = computed(() => {
    const latest = this.latest();
    return (
      latest !== null && Date.now() - latest.recorded_at.getTime() > STALE_READING_SECONDS * 1000
    );
  });
  protected readonly outside = computed(() => {
    const latest = this.latest();
    const equipment = this.equipment();
    return latest !== null && equipment !== null && this.isOutside(latest, equipment);
  });

  private equipmentId = 0;

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.equipmentId = Number(params.get('equipmentId'));
        this.load();
      });
  }

  protected isOutside(reading: SensorReading, equipment: MonitoredEquipment): boolean {
    return (
      reading.average_temperature < equipment.minCelsius ||
      reading.average_temperature > equipment.maxCelsius
    );
  }

  protected load(): void {
    this.source.load((empty) => {
      const equipment = MONITORED_EQUIPMENT.find((item) => item.id === this.equipmentId) ?? null;
      this.equipment.set(equipment);
      this.latest.set(
        empty
          ? null
          : (createLatestReadingsMock().find(
              (reading) => reading.equipment_id === this.equipmentId,
            ) ?? null),
      );
      this.policy.set(
        createAlertPoliciesMock().find((policy) => policy.equipment_id === this.equipmentId) ??
          null,
      );
    });
  }
}
