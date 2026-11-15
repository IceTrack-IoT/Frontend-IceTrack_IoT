import { computed, type DestroyRef, inject, Injectable, signal, type Signal } from '@angular/core';
import { debounceTime, filter, finalize, type Subscription, timer } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import {
  type ReportingFailure,
  toReportingFailure,
} from '@reporting/application/contracts/reporting-error';
import type { ReportPage, ReportQuery } from '@reporting/application/contracts/report-page';
import type { ReportRequest } from '@reporting/application/contracts/report-request';
import type {
  ReportEquipment,
  ReportScope,
  ReportSite,
} from '@reporting/application/contracts/report-scope';
import { DeleteReportUseCase } from '@reporting/application/use-cases/delete-report.use-case';
import { GetReportDownloadUrlUseCase } from '@reporting/application/use-cases/get-report-download-url.use-case';
import { LoadReportScopeUseCase } from '@reporting/application/use-cases/load-report-scope.use-case';
import { LoadReportsUseCase } from '@reporting/application/use-cases/load-reports.use-case';
import { RequestReportUseCase } from '@reporting/application/use-cases/request-report.use-case';
import { WatchReportChangesUseCase } from '@reporting/application/use-cases/watch-report-changes.use-case';
import { WatchReportUseCase } from '@reporting/application/use-cases/watch-report.use-case';

/** How long before its signature expires a download link stops being offered. */
const DOWNLOAD_LINK_EXPIRY_MARGIN_MS = 60_000;

/** How long live status changes are gathered before the report page shown is read again. */
const LIVE_CHANGES_DEBOUNCE_MS = 500;

/** The number of reports per page of the history. */
export const REPORT_PAGE_SIZE = 6;

/** The report history query of a new session: no search or filter, first page. */
const INITIAL_REPORT_QUERY: ReportQuery = {
  search: '',
  types: [],
  statuses: [],
  requestedFrom: null,
  requestedTo: null,
  page: 0,
  size: REPORT_PAGE_SIZE,
};

/** The search and filters of the report history; the page is chosen separately. */
export type ReportFilters = Omit<ReportQuery, 'page' | 'size'>;

/** The outcome of the last report request, until it is cleared. */
export interface ReportRequestState {
  readonly status: 'pending' | 'succeeded' | 'failed';
  readonly failure: ReportingFailure | null;
  /** The accepted report, once the request succeeded. */
  readonly report: Report | null;
}

/** Where obtaining the download link of a report stands, until it is cleared or the link expires. */
export interface ReportDownloadState {
  readonly reportId: number;
  readonly status: 'pending' | 'ready' | 'failed';
  /** The signed link, while it is still valid; null unless ready. */
  readonly url: string | null;
  /** The name the browser saves the file under; null unless ready. */
  readonly fileName: string | null;
  readonly failure: ReportingFailure | null;
}

/** The outcome of the last report deletion, until it is cleared. */
export interface ReportDeletionState {
  readonly reportId: number;
  readonly status: 'pending' | 'succeeded' | 'failed';
  readonly failure: ReportingFailure | null;
}

/** Failures of a deletion meaning the report shown is stale and must be read again. */
const STALE_DELETION_FAILURES: ReadonlySet<ReportingFailure> = new Set([
  'NOT_FOUND',
  'INVALID_STATUS_TRANSITION',
]);

/**
 * Reporting Store manages the owner's reports: the report history, the selected report while its
 * generation is followed, the sites and equipment a report can be scoped to, the outcome of a report
 * request, the deletion of finished reports, and the short-lived download link of a completed report.
 *
 * It holds signal-based state only and delegates every operation to Reporting use cases. The history is
 * searched, filtered and paged by the backend. A report in progress is read again when the live feed
 * reports a status change of it (periodically while the feed is unavailable), and the page shown is read
 * again when one of its reports changes. A download link is read on demand, offered until shortly before
 * its signature expires, and never stored beyond that.
 *
 * The history, the selected report and the scope are kept for the owner session, so a reporting view opened
 * again shows them at once while they are read again. Live changes, the follow-up of a report in progress,
 * the download link and the outcome of requests and deletions stop or are discarded once no reporting view
 * is open; everything is discarded when the session ends.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportingStore {
  private readonly loadReportsUseCase = inject(LoadReportsUseCase);
  private readonly watchReportUseCase = inject(WatchReportUseCase);
  private readonly requestReportUseCase = inject(RequestReportUseCase);
  private readonly getReportDownloadUrlUseCase = inject(GetReportDownloadUrlUseCase);
  private readonly loadReportScopeUseCase = inject(LoadReportScopeUseCase);
  private readonly watchReportChangesUseCase = inject(WatchReportChangesUseCase);
  private readonly deleteReportUseCase = inject(DeleteReportUseCase);

  // Report history.
  private readonly reportQuerySignal = signal<ReportQuery>(INITIAL_REPORT_QUERY);
  private readonly reportPageSignal = signal<ReportPage | null>(null);
  private readonly reportsLoadingSignal = signal(false);
  private readonly reportsFailureSignal = signal<ReportingFailure | null>(null);
  /** The search, filters and page of the history. */
  readonly reportQuery = this.reportQuerySignal.asReadonly();
  /** The current page of the history, or null until one is loaded. */
  readonly reportPage = this.reportPageSignal.asReadonly();
  /** The reports of the current page, most recent first, empty until loaded. */
  readonly reports = computed(() => this.reportPageSignal()?.items ?? []);
  readonly reportsLoaded = computed(() => this.reportPageSignal() !== null);
  readonly reportsLoading = this.reportsLoadingSignal.asReadonly();
  readonly reportsFailure = this.reportsFailureSignal.asReadonly();

  // Selected report.
  private readonly selectedIdSignal = signal<number | null>(null);
  private readonly selectedSignal = signal<Report | null>(null);
  private readonly selectedLoadingSignal = signal(false);
  private readonly selectedFailureSignal = signal<ReportingFailure | null>(null);
  private readonly watchingSignal = signal(false);
  /** The report last loaded for the detail, or null while none is loaded. */
  readonly selectedReport = this.selectedSignal.asReadonly();
  readonly selectedReportLoading = this.selectedLoadingSignal.asReadonly();
  /** Why the report could not be read; `NOT_FOUND` when it does not exist or is not the owner's. */
  readonly selectedReportFailure = this.selectedFailureSignal.asReadonly();
  /** Whether the selected report is being read again periodically while it is generated. */
  readonly watching = this.watchingSignal.asReadonly();

  // Scope.
  private readonly scopeSignal = signal<ReportScope | null>(null);
  private readonly scopeLoadingSignal = signal(false);
  private readonly scopeFailureSignal = signal<ReportingFailure | null>(null);
  readonly scopeLoaded = computed(() => this.scopeSignal() !== null);
  readonly scopeLoading = this.scopeLoadingSignal.asReadonly();
  readonly scopeFailure = this.scopeFailureSignal.asReadonly();
  /** The owner's sites, sorted by name. */
  readonly sites = computed(() =>
    [...(this.scopeSignal()?.sites ?? [])].sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
  );
  /** The owner's equipment, sorted by name. */
  readonly equipment = computed(() =>
    [...(this.scopeSignal()?.equipment ?? [])].sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
  );
  readonly siteById: Signal<ReadonlyMap<number, ReportSite>> = computed(
    () => new Map(this.sites().map((site) => [site.id, site])),
  );
  readonly equipmentById: Signal<ReadonlyMap<number, ReportEquipment>> = computed(
    () => new Map(this.equipment().map((item) => [item.id, item])),
  );

  // Request.
  private readonly requestSignal = signal<ReportRequestState | null>(null);
  readonly requestState = this.requestSignal.asReadonly();
  readonly requestPending = computed(() => this.requestSignal()?.status === 'pending');

  // Download.
  private readonly downloadSignal = signal<ReportDownloadState | null>(null);
  readonly downloadState = this.downloadSignal.asReadonly();
  readonly downloadPending = computed(() => this.downloadSignal()?.status === 'pending');

  // Deletion.
  private readonly deletionSignal = signal<ReportDeletionState | null>(null);
  readonly deletionState = this.deletionSignal.asReadonly();
  readonly deletionPending = computed(() => this.deletionSignal()?.status === 'pending');

  private reportsSubscription: Subscription | null = null;
  private selectedSubscription: Subscription | null = null;
  private scopeSubscription: Subscription | null = null;
  private requestSubscription: Subscription | null = null;
  private downloadSubscription: Subscription | null = null;
  private downloadExpirySubscription: Subscription | null = null;
  private deletionSubscription: Subscription | null = null;
  private liveChangesSubscription: Subscription | null = null;
  private attachedViews = 0;
  private retainedSession: DestroyRef | null = null;

  /**
   * Keeps the reporting state for a view. While any view is attached, the page shown is read again when
   * one of its reports changes status. Once the last one is destroyed, watching stops and any download
   * link and action outcome is discarded; the loaded reports and scope are kept until the session ends.
   * @param destroyRef - The lifetime of the view.
   * @param session - The lifetime of the owner session the loaded state is kept for.
   */
  attach(destroyRef: DestroyRef, session: DestroyRef): void {
    this.retain(session);
    this.attachedViews++;
    if (this.liveChangesSubscription === null) {
      this.liveChangesSubscription = this.watchReportChangesUseCase
        .execute()
        .pipe(
          filter(
            (event) =>
              event.kind === 'resync' ||
              (event.kind === 'report-status' &&
                this.reports().some((report) => report.id === event.reportId)),
          ),
          debounceTime(LIVE_CHANGES_DEBOUNCE_MS),
        )
        .subscribe(() => {
          if (this.reportPageSignal() !== null) {
            this.loadReports();
          }
        });
    }
    destroyRef.onDestroy(() => {
      this.attachedViews--;
      if (this.attachedViews === 0) {
        this.detachViews();
      }
    });
  }

  /**
   * Loads a page of the report history, keeping the one in memory until the new one arrives. A newer load
   * supersedes one still in progress.
   * @param change - The search, filters or page to apply; the rest of the current query is kept. Changing
   * the search or any filter returns to the first page.
   */
  loadReports(change: Partial<ReportFilters & Pick<ReportQuery, 'page'>> = {}): void {
    const filtersChanged = (
      ['search', 'types', 'statuses', 'requestedFrom', 'requestedTo'] as const
    ).some((key) => change[key] !== undefined);
    this.reportQuerySignal.update((query) => ({
      ...query,
      ...change,
      page: change.page ?? (filtersChanged ? 0 : query.page),
    }));
    this.reportsSubscription?.unsubscribe();
    this.reportsLoadingSignal.set(true);
    this.reportsFailureSignal.set(null);
    this.reportsSubscription = this.loadReportsUseCase
      .execute(this.reportQuerySignal())
      .pipe(finalize(() => this.reportsLoadingSignal.set(false)))
      .subscribe({
        next: (page) => this.reportPageSignal.set(page),
        error: (error: unknown) => this.reportsFailureSignal.set(toReportingFailure(error)),
      });
  }

  /**
   * Loads a report and, while it is generated, keeps reading it until it finishes.
   * @param reportId - The identifier of the report.
   */
  loadReport(reportId: number): void {
    if (this.selectedIdSignal() !== reportId) {
      this.selectedIdSignal.set(reportId);
      this.selectedSignal.set(null);
    }
    this.selectedSubscription?.unsubscribe();
    this.selectedLoadingSignal.set(true);
    this.selectedFailureSignal.set(null);
    this.watchingSignal.set(true);
    this.selectedSubscription = this.watchReportUseCase
      .execute(reportId)
      .pipe(
        finalize(() => {
          this.selectedLoadingSignal.set(false);
          this.watchingSignal.set(false);
        }),
      )
      .subscribe({
        next: (report) => {
          this.selectedLoadingSignal.set(false);
          this.selectedSignal.set(report);
          this.applyReport(report);
        },
        error: (error: unknown) => this.selectedFailureSignal.set(toReportingFailure(error)),
      });
  }

  /**
   * Loads the owner's sites and equipment, keeping the ones in memory until the new ones arrive, unless a
   * load is already in progress.
   */
  loadScope(): void {
    if (this.scopeLoadingSignal()) {
      return;
    }
    this.scopeLoadingSignal.set(true);
    this.scopeFailureSignal.set(null);
    this.scopeSubscription = this.loadReportScopeUseCase
      .execute()
      .pipe(finalize(() => this.scopeLoadingSignal.set(false)))
      .subscribe({
        next: (scope) => this.scopeSignal.set(scope),
        error: (error: unknown) => this.scopeFailureSignal.set(toReportingFailure(error)),
      });
  }

  /**
   * Requests a report; the accepted report joins the history.
   * @param request - What to report on.
   */
  requestReport(request: ReportRequest): void {
    if (this.requestPending()) {
      return;
    }
    this.requestSignal.set({ status: 'pending', failure: null, report: null });
    this.requestSubscription = this.requestReportUseCase.execute(request).subscribe({
      next: (report) => {
        this.requestSignal.set({ status: 'succeeded', failure: null, report });
        // The new report joins the history on the backend; the page shown is read again.
        if (this.reportPageSignal() !== null) {
          this.loadReports();
        }
      },
      error: (error: unknown) =>
        this.requestSignal.set({
          status: 'failed',
          failure: toReportingFailure(error),
          report: null,
        }),
    });
  }

  /** Forgets the outcome of the last report request. */
  clearRequest(): void {
    if (!this.requestPending()) {
      this.requestSignal.set(null);
    }
  }

  /**
   * Reads a fresh download link for a COMPLETED report. The link is offered until it is cleared, another
   * one is requested, or it is about to expire.
   * @param report - The report.
   */
  prepareDownload(report: Report): void {
    if (this.downloadPending()) {
      return;
    }
    this.clearDownload();
    const reportId = report.id;
    const idle = { reportId, url: null, fileName: null };
    this.downloadSignal.set({ ...idle, status: 'pending', failure: null });
    this.downloadSubscription = this.getReportDownloadUrlUseCase.execute(report).subscribe({
      next: (link) => {
        if (link === null) {
          this.downloadSignal.set({ ...idle, status: 'failed', failure: 'UNEXPECTED' });
          return;
        }
        this.downloadSignal.set({
          reportId,
          status: 'ready',
          url: link.url,
          fileName: link.fileName,
          failure: null,
        });
        const offeredFor = link.expiresAt.getTime() - Date.now() - DOWNLOAD_LINK_EXPIRY_MARGIN_MS;
        this.downloadExpirySubscription = timer(Math.max(0, offeredFor)).subscribe(() =>
          this.downloadSignal.set(null),
        );
      },
      error: (error: unknown) =>
        this.downloadSignal.set({ ...idle, status: 'failed', failure: toReportingFailure(error) }),
    });
  }

  /** Drops the download link, or the outcome of reading it. */
  clearDownload(): void {
    this.downloadSubscription?.unsubscribe();
    this.downloadExpirySubscription?.unsubscribe();
    this.downloadSubscription = null;
    this.downloadExpirySubscription = null;
    this.downloadSignal.set(null);
  }

  /**
   * Deletes a COMPLETED or FAILED report and its file. Its download link, if any, is dropped at once, the
   * report stops being the selected one and the page shown is read again. When the report turns out to be
   * gone or still in progress, what is shown is read again.
   * @param report - The report to delete.
   */
  deleteReport(report: Report): void {
    if (this.deletionPending()) {
      return;
    }
    const reportId = report.id;
    this.deletionSignal.set({ reportId, status: 'pending', failure: null });
    this.deletionSubscription = this.deleteReportUseCase.execute(report).subscribe({
      complete: () => {
        this.deletionSignal.set({ reportId, status: 'succeeded', failure: null });
        if (this.downloadSignal()?.reportId === reportId) {
          this.clearDownload();
        }
        if (this.selectedIdSignal() === reportId) {
          this.selectedSubscription?.unsubscribe();
          this.selectedSubscription = null;
          this.selectedSignal.set(null);
        }
        this.reportPageSignal.update((page) =>
          page === null ? null : { ...page, items: page.items.filter(({ id }) => id !== reportId) },
        );
        if (this.reportPageSignal() !== null) {
          this.loadReports();
        }
      },
      error: (error: unknown) => {
        const failure = toReportingFailure(error);
        this.deletionSignal.set({ reportId, status: 'failed', failure });
        if (STALE_DELETION_FAILURES.has(failure)) {
          if (this.reportPageSignal() !== null) {
            this.loadReports();
          }
          if (this.selectedIdSignal() === reportId) {
            this.loadReport(reportId);
          }
        }
      },
    });
  }

  /** Forgets the outcome of the last deletion. */
  clearDeletion(): void {
    if (!this.deletionPending()) {
      this.deletionSignal.set(null);
    }
  }

  /** Puts the report as the backend answered it in the page shown, when it is there. */
  private applyReport(report: Report): void {
    this.reportPageSignal.update((page) =>
      page === null
        ? null
        : { ...page, items: page.items.map((item) => (item.id === report.id ? report : item)) },
    );
  }

  private retain(session: DestroyRef): void {
    if (this.retainedSession === session) {
      return;
    }
    this.retainedSession = session;
    session.onDestroy(() => {
      if (this.retainedSession === session) {
        this.retainedSession = null;
        this.release();
      }
    });
  }

  /**
   * Stops watching and every read in progress, and discards any download link and action outcome once no
   * reporting view is open. The loaded reports and scope are kept.
   */
  private detachViews(): void {
    [
      this.liveChangesSubscription,
      this.reportsSubscription,
      this.selectedSubscription,
      this.scopeSubscription,
      this.requestSubscription,
      this.deletionSubscription,
    ].forEach((subscription) => subscription?.unsubscribe());
    this.liveChangesSubscription = null;
    this.reportsSubscription = null;
    this.selectedSubscription = null;
    this.scopeSubscription = null;
    this.requestSubscription = null;
    this.deletionSubscription = null;
    this.clearDownload();
    this.reportsLoadingSignal.set(false);
    this.selectedLoadingSignal.set(false);
    this.watchingSignal.set(false);
    this.scopeLoadingSignal.set(false);
    this.requestSignal.set(null);
    this.deletionSignal.set(null);
  }

  /** Discards every loaded value once the session ends. */
  private release(): void {
    this.detachViews();
    this.reportPageSignal.set(null);
    this.reportQuerySignal.set(INITIAL_REPORT_QUERY);
    this.reportsLoadingSignal.set(false);
    this.reportsFailureSignal.set(null);
    this.selectedIdSignal.set(null);
    this.selectedSignal.set(null);
    this.selectedLoadingSignal.set(false);
    this.selectedFailureSignal.set(null);
    this.watchingSignal.set(false);
    this.scopeSignal.set(null);
    this.scopeLoadingSignal.set(false);
    this.scopeFailureSignal.set(null);
    this.requestSignal.set(null);
    this.deletionSignal.set(null);
  }
}
