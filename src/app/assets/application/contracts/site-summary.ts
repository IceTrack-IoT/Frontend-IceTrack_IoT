/**
 * SiteSummary identifies one of the signed-in owner's sites by id and name. It is the narrow read-only
 * contract Assets offers to other bounded contexts that only need to refer to a site.
 */
export interface SiteSummary {
  readonly id: number;
  readonly name: string;
}
