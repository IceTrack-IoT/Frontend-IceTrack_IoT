/**
 * DashboardSite is a site the dashboard can open on or be scoped to. Assets owns the sites; Profiles only
 * refers to them by id and shows their name.
 */
export interface DashboardSite {
  readonly id: number;
  readonly name: string;
}
