/**
 * TelemetryBucket aggregates the reading batches of an equipment item recorded within one epoch-aligned
 * period `[bucket_start, bucket_end)`. Temperatures are in Celsius; the average is weighted by the samples.
 * An empty period has no bucket, so a missing bucket is a real gap in reporting.
 */
export interface TelemetryBucket {
  readonly bucket_start: Date;
  readonly bucket_end: Date;
  readonly min_temperature: number;
  readonly max_temperature: number;
  readonly avg_temperature: number;
  /** The weighted average humidity, or null when no batch carried humidity. */
  readonly avg_humidity: number | null;
  readonly sample_count: number;
  readonly batch_count: number;
  /** True when any aggregated batch was under maintenance. */
  readonly under_maintenance: boolean;
  /** The seconds the door was open, when the batches carry it. */
  readonly door_open_seconds: number | null;
  /** Latest server arrival time of the aggregated batches. */
  readonly last_received_at: Date;
}
