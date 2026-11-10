/**
 * One indicator computed by a completed report. `key` is a stable machine key (a per-unit key ends in
 * `.unit_<equipment_id>`); `label` is its English label. The unit is empty for a plain count.
 */
export interface KpiValue {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  /** The unit of the value, such as `%`, `h`, `°C`, `°C·min` or `stars`; empty when it has none. */
  readonly unit: string;
}
