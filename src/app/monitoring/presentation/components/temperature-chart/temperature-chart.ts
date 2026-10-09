import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SensorReading } from '@monitoring/domain/model/sensor-reading.entity';
import {
  type DateDisplay,
  LocalizedDatePipe,
} from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

const HEIGHT = 280;
const MARGIN = { top: 16, right: 20, bottom: 32, left: 48 } as const;
const MIN_WIDTH = 320;
/** Consecutive readings further apart than this many intervals are a data gap: the line breaks. */
const GAP_INTERVALS = 1.5;

interface ChartPoint {
  readonly x: number;
  readonly y: number;
  readonly reading: SensorReading;
  readonly outside: boolean;
}

/**
 * Returns evenly spaced round values covering a range, for an axis.
 * @param low - The lowest value to cover.
 * @param high - The highest value to cover.
 * @param count - The approximate number of ticks.
 * @returns The tick values, ascending.
 */
function niceTicks(low: number, high: number, count: number): number[] {
  const raw = (high - low) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const residual = raw / magnitude;
  const step = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;
  const ticks: number[] = [];
  for (let value = Math.floor(low / step) * step; value <= high + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return ticks;
}

/**
 * Historical temperature chart of an equipment item: the average temperature as a line over the min–max
 * range of each reading, the threshold limits, and markers on the readings outside the threshold. The line
 * breaks on data gaps instead of interpolating. Pointer users get a crosshair and tooltip; keyboard and
 * screen reader users move through the readings as a slider with arrow keys. The parent provides a table
 * view of the same readings.
 */
@Component({
  imports: [TranslatePipe, LocalizedDatePipe, LocalizedNumberPipe, TemperaturePipe],
  selector: 'app-temperature-chart',
  styleUrl: './temperature-chart.css',
  templateUrl: './temperature-chart.html',
})
export class TemperatureChart {
  /** The readings to chart, oldest first. */
  readonly readings = input.required<readonly SensorReading[]>();
  readonly minCelsius = input.required<number>();
  readonly maxCelsius = input.required<number>();
  /** The aggregation interval of the readings, used to detect data gaps. */
  readonly intervalMinutes = input.required<number>();
  /** How the time axis labels are shown. */
  readonly timeDisplay = input<DateDisplay>('time');

  protected readonly height = HEIGHT;
  protected readonly margin = MARGIN;
  protected readonly width = signal(720);
  protected readonly activeIndex = signal<number | null>(null);

  protected readonly layout = computed(() => {
    const readings = this.readings();
    const width = this.width();
    const left = MARGIN.left;
    const right = width - MARGIN.right;
    const top = MARGIN.top;
    const bottom = HEIGHT - MARGIN.bottom;
    const first = readings[0]?.recorded_at.getTime() ?? 0;
    const last = readings.at(-1)?.recorded_at.getTime() ?? 1;
    const span = Math.max(last - first, 1);

    const values = readings.flatMap((reading) => [
      reading.min_temperature,
      reading.max_temperature,
    ]);
    const low = Math.min(...values, this.minCelsius());
    const high = Math.max(...values, this.maxCelsius());
    const padding = (high - low) * 0.1 || 1;
    const ticks = niceTicks(low - padding, high + padding, 5);
    const domainLow = ticks[0];
    const domainHigh = ticks[ticks.length - 1];

    const x = (time: number): number => left + ((time - first) / span) * (right - left);
    const y = (value: number): number =>
      bottom - ((value - domainLow) / (domainHigh - domainLow)) * (bottom - top);

    const points: ChartPoint[] = readings.map((reading) => ({
      x: x(reading.recorded_at.getTime()),
      y: y(reading.average_temperature),
      reading,
      outside:
        reading.average_temperature < this.minCelsius() ||
        reading.average_temperature > this.maxCelsius(),
    }));

    const gapMs = this.intervalMinutes() * 60_000 * GAP_INTERVALS;
    const segments: ChartPoint[][] = [];
    points.forEach((point, index) => {
      const previous = readings[index - 1];
      const gap =
        previous && point.reading.recorded_at.getTime() - previous.recorded_at.getTime() > gapMs;
      if (index === 0 || gap) {
        segments.push([]);
      }
      segments[segments.length - 1].push(point);
    });

    const xTickCount = Math.min(points.length, Math.max(2, Math.floor((right - left) / 110)));
    const xTicks = Array.from({ length: xTickCount }, (_, index) => {
      const point = points[Math.round((index * (points.length - 1)) / Math.max(xTickCount - 1, 1))];
      return { x: point.x, time: point.reading.recorded_at };
    });

    return {
      left,
      right,
      top,
      bottom,
      points,
      lines: segments.map(
        (segment) => 'M' + segment.map((point) => `${point.x},${point.y}`).join('L'),
      ),
      bands: segments.map((segment) => {
        const upper = segment.map((point) => `${point.x},${y(point.reading.max_temperature)}`);
        const lower = [...segment]
          .reverse()
          .map((point) => `${point.x},${y(point.reading.min_temperature)}`);
        return `M${[...upper, ...lower].join('L')}Z`;
      }),
      yTicks: ticks.map((value) => ({ value, y: y(value) })),
      xTicks,
      maxY: y(this.maxCelsius()),
      minY: y(this.minCelsius()),
    };
  });

  protected readonly activePoint = computed(() => {
    const index = this.activeIndex();
    return index === null ? null : (this.layout().points[index] ?? null);
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);
    // The chart is drawn at the rendered width so its text keeps a legible size on any screen.
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(([entry]) =>
        this.width.set(Math.max(MIN_WIDTH, Math.round(entry.contentRect.width))),
      );
      observer.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected track(event: PointerEvent): void {
    const target = event.currentTarget;
    if (!(target instanceof Element)) {
      return;
    }
    const bounds = target.getBoundingClientRect();
    const position = ((event.clientX - bounds.left) / bounds.width) * this.width();
    this.activeIndex.set(this.nearestIndex(position));
  }

  protected step(event: KeyboardEvent): void {
    const count = this.layout().points.length;
    const current = this.activeIndex() ?? count - 1;
    const next: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowDown: current - 1,
      ArrowRight: current + 1,
      ArrowUp: current + 1,
      Home: 0,
      End: count - 1,
    };
    if (event.key in next) {
      event.preventDefault();
      this.activeIndex.set(Math.min(count - 1, Math.max(0, next[event.key])));
    }
  }

  protected focusLatest(): void {
    if (this.activeIndex() === null) {
      this.activeIndex.set(this.layout().points.length - 1);
    }
  }

  private nearestIndex(position: number): number {
    let nearest = 0;
    this.layout().points.forEach((point, index, points) => {
      if (Math.abs(point.x - position) < Math.abs(points[nearest].x - position)) {
        nearest = index;
      }
    });
    return nearest;
  }
}
