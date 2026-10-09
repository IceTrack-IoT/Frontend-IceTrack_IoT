import type { DateDisplay } from '@shared/presentation/pipes/localized-date.pipe';

/** The periods of telemetry history the owner can chart. */
export const TELEMETRY_RANGES = ['2H', '6H', '24H', '7D'] as const;

export type TelemetryRange = (typeof TELEMETRY_RANGES)[number];

/** The length, aggregation interval and time labels of each telemetry period. */
export const TELEMETRY_RANGE_WINDOWS: Readonly<
  Record<
    TelemetryRange,
    {
      readonly durationMinutes: number;
      readonly intervalMinutes: number;
      readonly timeDisplay: DateDisplay;
    }
  >
> = {
  '2H': { durationMinutes: 120, intervalMinutes: 5, timeDisplay: 'time' },
  '6H': { durationMinutes: 360, intervalMinutes: 15, timeDisplay: 'time' },
  '24H': { durationMinutes: 1_440, intervalMinutes: 60, timeDisplay: 'time' },
  '7D': { durationMinutes: 10_080, intervalMinutes: 360, timeDisplay: 'date' },
};
