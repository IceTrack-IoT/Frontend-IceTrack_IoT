import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, map } from 'rxjs';
import type { Report } from '@reporting/domain/model/report.entity';
import { ReportStatus } from '@reporting/domain/value-objects/report-status';
import { ReportType } from '@reporting/domain/value-objects/report-type';
import { ReportingStore } from '@reporting/application/reporting-store';
import { ReportDownload } from '@reporting/presentation/components/report-download/report-download';
import { REPORT_STATUS_APPEARANCE } from '@reporting/presentation/report-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

/** How long the owner may keep typing before the search is sent. */
const FILTER_DEBOUNCE_MS = 300;
const DAY_MS = 86_400_000;

/**
 * Parses the value of a date input as the start of that local day.
 * @param value - The value, as `YYYY-MM-DD`, or an empty string.
 * @returns The date, or null when the value is empty.
 */
function parseDay(value: string): Date | null {
  return value === '' ? null : new Date(`${value}T00:00:00`);
}

/**
 * Reports of the owner, searched by name and filtered by type, generation status and request date, all
 * by the backend, which also pages them. Status changes of the listed reports arrive live. A report can be
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

  /** Whether the date range is inverted; the range is then not applied. */
  protected readonly invalidRange = computed(() => {
    const from = parseDay(this.filterValue().from);
    const to = parseDay(this.filterValue().to);
    return from !== null && to !== null && from > to;
  });
  /** Whether the search or a filter narrows the history. */
  protected readonly filtered = computed(() => {
    const { search, types, statuses, requestedFrom, requestedTo } = this.store.reportQuery();
    return (
      search.trim() !== '' ||
      types.length > 0 ||
      statuses.length > 0 ||
      requestedFrom !== null ||
      requestedTo !== null
    );
  });
  protected readonly visible = computed(() => this.store.reports());
  /** The number of reports matching the search and filters. */
  protected readonly total = computed(() => this.store.reportPage()?.totalElements ?? 0);
  protected readonly page = computed(() => this.store.reportQuery().page + 1);
  protected readonly pageCount = computed(() =>
    Math.max(1, this.store.reportPage()?.totalPages ?? 1),
  );

  constructor() {
    this.store.attach(inject(DestroyRef));
    this.filters.valueChanges
      .pipe(debounceTime(FILTER_DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe(() => this.applyFilters());
    this.load();
  }

  protected load(): void {
    this.store.loadReports();
  }

  protected goToPage(page: number): void {
    this.store.loadReports({ page: page - 1 });
  }

  /** Sends the search and filters; an inverted date range is not applied. */
  private applyFilters(): void {
    const { search, type, status, from, to } = this.filters.getRawValue();
    const fromDay = this.invalidRange() ? null : parseDay(from);
    const toDay = this.invalidRange() ? null : parseDay(to);
    this.store.loadReports({
      search,
      types: type === 'ALL' ? [] : [type],
      statuses: status === 'ALL' ? [] : [status],
      requestedFrom: fromDay,
      // The whole last day is included: the backend bound is inclusive.
      requestedTo: toDay === null ? null : new Date(toDay.getTime() + DAY_MS - 1),
    });
  }

  protected clearFilters(): void {
    this.filters.reset();
  }

  protected download(report: Report): void {
    this.store.prepareDownload(report);
  }
}
