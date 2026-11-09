import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import { ReportStatus } from '@reporting/domain/value-objects/report-status';
import { ReportType } from '@reporting/domain/value-objects/report-type';
import { ReportingStore } from '@reporting/application/reporting-store';
import { ReportDownload } from '@reporting/presentation/components/report-download/report-download';
import { REPORT_STATUS_APPEARANCE } from '@reporting/presentation/report-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import {
  pageCountOf,
  pageOf,
  Pagination,
} from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

const PAGE_SIZE = 6;

/**
 * Parses the value of a date input as the start of that local day.
 * @param value - The value, as `YYYY-MM-DD`, or an empty string.
 * @returns The date, or null when the value is empty.
 */
function parseDay(value: string): Date | null {
  return value === '' ? null : new Date(`${value}T00:00:00`);
}

/**
 * Reports of the owner, searched by name and filtered by type, generation status and request date. The
 * backend returns the whole history at once, so filtering and paging happen here. A report can be
 * downloaded once its generation is completed.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Icon,
    Pagination,
    ReportDownload,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
  ],
  selector: 'app-report-list',
  styleUrl: './report-list.css',
  templateUrl: './report-list.html',
})
export class ReportList {
  protected readonly store = inject(ReportingStore);
  protected readonly types = Object.values(ReportType);
  protected readonly statuses = Object.values(ReportStatus);
  protected readonly statusAppearance = REPORT_STATUS_APPEARANCE;

  protected readonly filters = inject(NonNullableFormBuilder).group({
    search: [''],
    type: ['ALL' as ReportType | 'ALL'],
    status: ['ALL' as ReportStatus | 'ALL'],
    from: [''],
    to: [''],
  });
  private readonly filterValue = toSignal(
    this.filters.valueChanges.pipe(map(() => this.filters.getRawValue())),
    { initialValue: this.filters.getRawValue() },
  );

  protected readonly page = signal(1);

  /** Whether the date range is inverted; the range is then not applied. */
  protected readonly invalidRange = computed(() => {
    const from = parseDay(this.filterValue().from);
    const to = parseDay(this.filterValue().to);
    return from !== null && to !== null && from > to;
  });
  protected readonly filtered = computed(() => {
    const { search, type, status } = this.filterValue();
    const term = search.trim().toLowerCase();
    const from = this.invalidRange() ? null : parseDay(this.filterValue().from);
    const toDay = this.invalidRange() ? null : parseDay(this.filterValue().to);
    const to = toDay === null ? null : new Date(toDay.getTime() + 86_400_000);
    return this.store
      .reports()
      .filter(
        (report) =>
          (term === '' || report.name.toLowerCase().includes(term)) &&
          (type === 'ALL' || report.type === type) &&
          (status === 'ALL' || report.status === status) &&
          (from === null || report.requested_at >= from) &&
          (to === null || report.requested_at < to),
      );
  });
  protected readonly total = computed(() => this.store.reports().length);
  protected readonly pageCount = computed(() => pageCountOf(this.filtered().length, PAGE_SIZE));
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  constructor() {
    this.store.attach(inject(DestroyRef));
    this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.page.set(1));
    this.load();
  }

  protected load(): void {
    this.store.loadReports();
  }

  protected clearFilters(): void {
    this.filters.reset();
  }

  protected download(report: Report): void {
    this.store.prepareDownload(report);
  }
}
