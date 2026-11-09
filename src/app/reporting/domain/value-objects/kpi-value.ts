/**
 * One indicator computed by a completed report. The backend does not document the type of `value`, so a
 * numeric value is kept as a number and any other value as text.
 */
export interface KpiValue {
  readonly label: string;
  readonly value: number | string;
  /** The unit of the value; empty when it has none. */
  readonly unit: string;
}
