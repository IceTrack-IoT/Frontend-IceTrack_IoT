import { inject, Injectable } from '@angular/core';
import { filter, map, type Observable } from 'rxjs';
import type {
  ReportFeedEvent,
  ReportFeedStatus,
} from '@reporting/application/contracts/report-feed-event';
import { OwnerStreamSourcePort } from '@reporting/application/ports/owner-stream-source.port';
import type { ReportStatusFeedPort } from '@reporting/application/ports/report-status-feed.port';

/** The owner stream event sent when a report of the owner changes generation status. */
const REPORT_STATUS_CHANGED_EVENT = 'report-status-changed';

const REPORT_FEED_STATUSES: readonly ReportFeedStatus[] = ['GENERATING', 'COMPLETED', 'FAILED'];

/**
 * ReportStatusChangedStreamResource is the data of a `report-status-changed` event. Only the properties
 * the web application reads are declared.
 */
interface ReportStatusChangedStreamResource {
  report_id: number;
  status: ReportFeedStatus;
}

function isReportStatusChanged(data: unknown): data is ReportStatusChangedStreamResource {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const reportId: unknown = 'report_id' in data ? data.report_id : null;
  const status: unknown = 'status' in data ? data.status : null;
  return (
    typeof reportId === 'number' &&
    Number.isFinite(reportId) &&
    REPORT_FEED_STATUSES.some((value) => value === status)
  );
}

/**
 * ReportStatusFeedApi implements the ReportStatusFeedPort with the `report-status-changed` events of the
 * owner event stream, which Monitoring and Alerting relays on its single connection. Payloads that do not
 * match the documented resource, or carry an undocumented status, are ignored; a gap in the stream asks
 * for reports in progress to be read again.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportStatusFeedApi implements ReportStatusFeedPort {
  private readonly source = inject(OwnerStreamSourcePort);

  watch(): Observable<ReportFeedEvent> {
    return this.source.watch(REPORT_STATUS_CHANGED_EVENT).pipe(
      map((signal): ReportFeedEvent | null => {
        switch (signal.kind) {
          case 'gap':
            return { kind: 'resync' };
          case 'interrupted':
          case 'restored':
            return { kind: signal.kind };
          case 'event':
            return isReportStatusChanged(signal.data)
              ? {
                  kind: 'report-status',
                  reportId: signal.data.report_id,
                  status: signal.data.status,
                }
              : null;
        }
      }),
      filter((event): event is ReportFeedEvent => event !== null),
    );
  }
}
