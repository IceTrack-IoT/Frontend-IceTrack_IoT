import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ReportsPort } from '@reporting/application/ports/reports.port';
import { ReportsApi } from '@reporting/infrastructure/api/reports-api';
import { ReportStatusFeedPort } from '@reporting/application/ports/report-status-feed.port';
import { ReportStatusFeedApi } from '@reporting/infrastructure/streaming/report-status-feed-api';

/**
 * Binds the Reporting application ports to their infrastructure adapters. The report scope port is bound
 * by Assets Management, which owns the sites and equipment, and the owner stream source port by
 * Monitoring and Alerting, which holds the owner event stream.
 */
export function provideReporting(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ReportsPort, useExisting: ReportsApi },
    { provide: ReportStatusFeedPort, useExisting: ReportStatusFeedApi },
  ]);
}
