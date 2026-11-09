import { computed, type DestroyRef, inject, Injectable, signal, type Signal } from '@angular/core';
import { finalize, type Subscription, timer } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import {
  type ReportingFailure,
  toReportingFailure,
} from '@reporting/application/contracts/reporting-error';
import type { ReportRequest } from '@reporting/application/contracts/report-request';
import type {
  ReportEquipment,
  ReportScope,
  ReportSite,
} from '@reporting/application/contracts/report-scope';
import { GetReportDownloadUrlUseCase } from '@reporting/application/use-cases/get-report-download-url.use-case';
import { LoadReportScopeUseCase } from '@reporting/application/use-cases/load-report-scope.use-case';
import { LoadReportsUseCase } from '@reporting/application/use-cases/load-reports.use-case';
import { RequestReportUseCase } from '@reporting/application/use-cases/request-report.use-case';
import { WatchReportUseCase } from '@reporting/application/use-cases/watch-report.use-case';

/**
 * How long a download link is offered after it was read. The backend signs it for 15 minutes; a minute is
 * kept as margin.
 */
const DOWNLOAD_LINK_LIFETIME_MS = 14 * 60_000;

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
  readonly failure: ReportingFailure | null;
}

/**
 * Reporting Store manages the owner's reports: the report history, the selected report while its
 * generation is followed, the sites and equipment a report can be scoped to, the outcome of a report
 * request, and the short-lived download link of a completed report.
 *
 * It holds signal-based state only and delegates every operation to Reporting use cases. A report in
 * progress is read again periodically until it finishes. A download link is read on demand, offered for
 * less than its 15-minute validity, and never stored beyond that. Everything is discarded once no
 * reporting view is open.
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

  // Report history.
  private readonly reportsSignal = signal<readonly Report[] | null>(null);
  private readonly reportsLoadingSignal = signal(false);
  private readonly reportsFailureSignal = signal<ReportingFailure | null>(null);
  /** The owner's reports, most recent first, empty until they are loaded. */
  readonly reports = computed(() => this.reportsSignal() ?? []);
  readonly reportsLoaded = computed(() => this.reportsSignal() !== null);
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

  private reportsSubscription: Subscription | null = null;
  private selectedSubscription: Subscription | null = null;
  private scopeSubscription: Subscription | null = null;
  private requestSubscription: Subscription | null = null;
  private downloadSubscription: Subscription | null = null;
  private downloadExpirySubscription: Subscription | null = null;
  private attachedViews = 0;

  /**
   * Keeps the reporting state while the caller lives. Every reporting view attaches; once the last one is
   * destroyed, polling stops and the state, including any download link, is discarded.
   * @param destroyRef - The lifetime of the caller.
   */
  attach(destroyRef: DestroyRef): void {
    this.attachedViews++;
    destroyRef.onDestroy(() => {
      this.attachedViews--;
      if (this.attachedViews === 0) {
        this.release();
      }
    });
  }

  /**
   * Loads the report history, keeping the one in memory until the new one arrives.
   */
  loadReports(): void {
    this.reportsSubscription?.unsubscribe();
    this.reportsLoadingSignal.set(true);
    this.reportsFailureSignal.set(null);
    this.reportsSubscription = this.loadReportsUseCase
      .execute()
      .pipe(finalize(() => this.reportsLoadingSignal.set(false)))
      .subscribe({
        next: (reports) => this.reportsSignal.set(reports),
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
   * Loads the owner's sites and equipment, unless they are already loaded.
   */
  loadScope(): void {
    if (this.scopeSignal() !== null || this.scopeLoadingSignal()) {
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
        this.applyReport(report);
        this.requestSignal.set({ status: 'succeeded', failure: null, report });
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
    this.downloadSignal.set({ reportId, status: 'pending', url: null, failure: null });
    this.downloadSubscription = this.getReportDownloadUrlUseCase.execute(report).subscribe({
      next: (url) => {
        if (url === null) {
          this.downloadSignal.set({ reportId, status: 'failed', url: null, failure: 'UNEXPECTED' });
          return;
        }
        this.downloadSignal.set({ reportId, status: 'ready', url, failure: null });
        this.downloadExpirySubscription = timer(DOWNLOAD_LINK_LIFETIME_MS).subscribe(() =>
          this.downloadSignal.set(null),
        );
      },
      error: (error: unknown) =>
        this.downloadSignal.set({
          reportId,
          status: 'failed',
          url: null,
          failure: toReportingFailure(error),
        }),
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

  /** Puts the report as the backend answered it in the history, newest first. */
  private applyReport(report: Report): void {
    this.reportsSignal.update((reports) => {
      if (reports === null) {
        return null;
      }
      return reports.some((item) => item.id === report.id)
        ? reports.map((item) => (item.id === report.id ? report : item))
        : [report, ...reports];
    });
  }

  /** Discards every loaded value and any download link once no reporting view is open. */
  private release(): void {
    [
      this.reportsSubscription,
      this.selectedSubscription,
      this.scopeSubscription,
      this.requestSubscription,
    ].forEach((subscription) => subscription?.unsubscribe());
    this.reportsSubscription = null;
    this.selectedSubscription = null;
    this.scopeSubscription = null;
    this.requestSubscription = null;
    this.clearDownload();
    this.reportsSignal.set(null);
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
  }
}
