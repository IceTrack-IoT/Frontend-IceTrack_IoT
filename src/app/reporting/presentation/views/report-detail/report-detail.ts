import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Report } from '@reporting/domain/model/report.entity';
import { ReportStatus } from '@reporting/domain/value-objects/report-status';
import {
  checkReportStatusMock,
  createReportsMock,
  REPORT_KPIS,
} from '@reporting/presentation/mocks/reporting.mock';
import {
  IN_PROGRESS_REPORT_STATUSES,
  REPORT_STATUS_APPEARANCE,
} from '@reporting/presentation/report-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

/**
 * Detail of a report: its generation status and, once completed, its indicators and the download of its
 * file. While the report is being generated the owner can check its status again; a failed report can be
 * requested again.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    Icon,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
    LocalizedNumberPipe,
  ],
  selector: 'app-report-detail',
  styleUrl: './report-detail.css',
  templateUrl: './report-detail.html',
})
export class ReportDetail {
  protected readonly source = injectMockDataSource();
  protected readonly statusAppearance = REPORT_STATUS_APPEARANCE;

  protected readonly report = signal<Report | null>(null);
  /** The translation key of the outcome of the last action, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  protected readonly inProgress = computed(() => {
    const report = this.report();
    return report !== null && IN_PROGRESS_REPORT_STATUSES.has(report.status);
  });
  protected readonly completed = computed(() => this.report()?.status === ReportStatus.COMPLETED);
  protected readonly failed = computed(() => this.report()?.status === ReportStatus.FAILED);
  protected readonly kpis = computed(() => {
    const report = this.report();
    return report && this.completed() ? (REPORT_KPIS[report.id] ?? []) : [];
  });

  private reportId = 0;

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.reportId = Number(params.get('reportId'));
        this.load();
      });
  }

  protected load(): void {
    this.announcement.set(null);
    this.source.load((empty) => {
      const report = empty
        ? undefined
        : createReportsMock().find((item) => item.id === this.reportId);
      this.report.set(report ?? null);
    });
  }

  /** TODO: Check the status through the reporting store, or receive it when the backend pushes it. */
  protected checkStatus(): void {
    const report = this.report();
    if (!report) {
      return;
    }
    this.announcement.set(null);
    this.source.mutate(() => {
      const checked = checkReportStatusMock(report);
      this.report.set(checked);
      this.announcement.set(
        checked.status === ReportStatus.COMPLETED
          ? 'reporting.detail.nowCompleted'
          : 'reporting.detail.stillGenerating',
      );
    });
  }

  /** TODO: Download the report artifact through the reporting store once the download contract exists. */
  protected download(): void {
    this.announcement.set('reporting.download.simulated');
  }
}
