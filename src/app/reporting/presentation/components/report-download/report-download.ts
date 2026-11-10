import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { Report } from '@reporting/domain/model/report.entity';
import type { ReportDownloadState } from '@reporting/application/reporting-store';
import { reportDownloadErrorKey } from '@reporting/presentation/report-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Download control of a completed report. The file is behind a signed link valid for 15 minutes, so the
 * owner first asks for a fresh link and then opens it; opening it is a direct click on a real link, which
 * browsers never block. The link disappears when it is about to expire.
 */
@Component({
  imports: [TranslatePipe, Icon],
  selector: 'app-report-download',
  styleUrl: './report-download.css',
  templateUrl: './report-download.html',
})
export class ReportDownload {
  readonly report = input.required<Report>();
  /** Where obtaining a download link stands, for any report. */
  readonly state = input<ReportDownloadState | null>(null);
  /** Whether to render the compact variant used in tables. */
  readonly compact = input(false);
  readonly requested = output<void>();

  /** The state of this report's download, if it is the one being prepared. */
  protected readonly own = computed(() => {
    const state = this.state();
    return state?.reportId === this.report().id ? state : null;
  });
  /** Whether another report's link is being prepared. */
  protected readonly busy = computed(() => {
    const state = this.state();
    return state?.status === 'pending' && state.reportId !== this.report().id;
  });
  protected readonly errorKey = computed(() => {
    const own = this.own();
    return own?.status === 'failed' ? reportDownloadErrorKey(own.failure) : null;
  });
  protected readonly errorId = computed(() => `report-download-error-${this.report().id}`);
}
