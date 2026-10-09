/**
 * Represents an indicator computed by a report generation, such as the time in safe range.
 */
export interface KpiValue {
  readonly label: string;
  readonly value: number;
  readonly unit: string;
}
