import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { KpiValue } from '@reporting/domain/value-objects/kpi-value';
import { ReportStatus } from '@reporting/domain/value-objects/report-status';
import { ReportingStore } from '@reporting/application/reporting-store';
import { DeleteReportDialog } from '@reporting/presentation/components/delete-report-dialog/delete-report-dialog';
import { ReportDownload } from '@reporting/presentation/components/report-download/report-download';
import {
  REPORT_STATUS_APPEARANCE,
  reportDeletionErrorKey,
} from '@reporting/presentation/report-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

/**
 * Detail of a report: its generation status, scope and period and, once completed, its indicators and the
 * download of its file. While the report is generated its status is read again automatically, and the
 * owner can also check it on demand; a failed report shows why and can be requested again. A service
 * document names the service request it documents. A finished report can be deleted after confirmation,
 * which returns to the report list.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    DeleteReportDialog,
    Icon,
    ReportDownload,
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
  protected readonly store = inject(ReportingStore);
  protected readonly statusAppearance = REPORT_STATUS_APPEARANCE;
  protected readonly failedStatus = ReportStatus.FAILED;

  private readonly reportId = signal(0);
  /** Whether the deletion confirmation is open. */
  protected readonly confirmingDeletion = signal(false);
  /** The failure of the last deletion of this report, shown in its confirmation. */
  protected readonly deletionErrorKey = computed(() => {
    const state = this.store.deletionState();
    return state?.reportId === this.reportId() && state.status === 'failed'
      ? reportDeletionErrorKey(state.failure)
      : null;
  });

  /** The report of this view, once loaded. */
  protected readonly report = computed(() => {
    const report = this.store.selectedReport();
    return report?.id === this.reportId() ? report : null;
  });
  protected readonly kpis = computed<readonly KpiValue[]>(() => this.report()?.kpis ?? []);
  /** The name of the site the report covers, or null when it covers every site. */
  protected readonly siteLabel = computed(() => {
    const siteId = this.report()?.filters.site_id ?? null;
    return siteId === null ? null : (this.store.siteById().get(siteId)?.name ?? `#${siteId}`);
  });
  /** The name of the equipment the report covers, or null when it covers all of it. */
  protected readonly equipmentLabel = computed(() => {
    const equipmentId = this.report()?.filters.equipment_id ?? null;
    return equipmentId === null
      ? null
      : (this.store.equipmentById().get(equipmentId)?.name ?? `#${equipmentId}`);
  });

  constructor() {
    const router = inject(Router);
    this.store.attach(inject(DestroyRef));
    this.store.clearDeletion();
    // Once this report is deleted there is nothing left to show here.
    effect(() => {
      const state = this.store.deletionState();
      if (state?.reportId === this.reportId() && state.status === 'succeeded') {
        untracked(() => void router.navigate(['/reports']));
      }
    });
    this.store.loadScope();
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.reportId.set(Number(params.get('reportId')));
        this.store.clearDownload();
        this.load();
      });
  }

  protected load(): void {
    this.store.loadReport(this.reportId());
  }

  protected openDeletion(): void {
    this.store.clearDeletion();
    this.confirmingDeletion.set(true);
  }

  protected closeDeletion(): void {
    this.confirmingDeletion.set(false);
    this.store.clearDeletion();
  }

  protected delete(): void {
    const report = this.report();
    if (report !== null) {
      this.store.deleteReport(report);
    }
  }

  protected download(): void {
    const report = this.report();
    if (report !== null) {
      this.store.prepareDownload(report);
    }
  }
}
