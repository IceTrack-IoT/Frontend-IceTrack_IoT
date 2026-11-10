/** A site of the signed-in owner a report can be scoped to. */
export interface ReportSite {
  readonly id: number;
  readonly name: string;
}

/** An equipment item of the signed-in owner a report can be scoped to. */
export interface ReportEquipment {
  readonly id: number;
  readonly name: string;
  readonly siteId: number;
}

/**
 * The sites and equipment of the signed-in owner, as Reporting needs them to scope a report and to name the
 * scope of an existing one. Assets Management owns them; Reporting only reads their identity.
 */
export interface ReportScope {
  readonly sites: readonly ReportSite[];
  readonly equipment: readonly ReportEquipment[];
}
