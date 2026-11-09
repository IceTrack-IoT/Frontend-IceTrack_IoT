/**
 * A maintenance window opened on the equipment while the work of a service request was in progress.
 * Monitoring owns the window; the service request only keeps this link to it.
 */
export interface MaintenanceWindowLink {
  readonly window_id: number;
  /** How the window was started; documented values are `APP` and `BUTTON`. */
  readonly origin: string;
  /** The technician attributed to the window; null when unknown. */
  readonly technician_id: number | null;
  readonly started_at: Date;
  /** When the window ended; null while it is open. */
  readonly ended_at: Date | null;
  /** Why the window ended; null while it is open. */
  readonly closure_reason: string | null;
}
