/**
 * The totals of the owner's dashboard, computed by the backend in one read.
 */
export interface DashboardSummary {
  readonly generatedAt: Date;
  readonly siteCount: number;
  readonly equipment: {
    readonly total: number;
    /** Units reporting within their offline window, judged by the server clock. */
    readonly reporting: number;
    readonly silent: number;
    readonly neverReported: number;
  };
  readonly alerts: {
    readonly open: number;
    readonly acknowledged: number;
    /** OPEN and ACKNOWLEDGED alerts of CRITICAL severity. */
    readonly activeCritical: number;
  };
  /** Service requests PENDING, ACCEPTED or IN_PROGRESS. */
  readonly activeServiceRequests: number;
}
