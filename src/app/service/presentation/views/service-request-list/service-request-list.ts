import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ServicePriority } from '@service/domain/value-objects/service-priority';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import { ServiceType } from '@service/domain/value-objects/service-type';
import {
  awaitsAssignment,
  type ServiceRequestSummary,
} from '@service/application/contracts/service-request-page';
import { ServiceRequestsStore } from '@service/application/service-requests-store';
import { InterventionSummary } from '@service/presentation/components/intervention-summary/intervention-summary';
import {
  SERVICE_PRIORITY_APPEARANCE,
  SERVICE_STATUS_APPEARANCE,
} from '@service/presentation/service-request-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { SHELL_LIFETIME } from '@shared/presentation/components/private-layout/shell-lifetime';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

type StatusFilter = ServiceStatus | 'ALL';

const DAY_MS = 86_400_000;

/**
 * Parses the value of a date input as the start of that local day.
 * @param value - The value, as `YYYY-MM-DD`, or an empty string.
 * @returns The date, or null when the value is empty or unreadable.
 */
function parseDay(value: string): Date | null {
  if (value === '') {
    return null;
  }
  const day = new Date(`${value}T00:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

/**
 * Formats a date as the value of a date input, in local time.
 * @param date - The date, or null.
 * @returns The value, as `YYYY-MM-DD`, or an empty string.
 */
function formatDay(date: Date | null): string {
  if (date === null) {
    return '';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The first creation day must not be after the last one. */
const orderedDays: ValidatorFn = (group) => {
  const from = parseDay(String(group.get('from')?.value ?? ''));
  const to = parseDay(String(group.get('to')?.value ?? ''));
  return from !== null && to !== null && from.getTime() > to.getTime()
    ? { invalidRange: true }
    : null;
};

/**
 * Reads a positive integer identifier from a query parameter value.
 * @param value - The value, or null.
 * @returns The identifier, or null when it is not a positive integer.
 */
function positiveId(value: string | null): number | null {
  const id = Number(value);
  return value !== null && Number.isInteger(id) && id > 0 ? id : null;
}

/** The asynchronous states of the request table while it is not populated. */
type ListStatus = 'loading' | 'error' | 'ready';

/**
 * Service requests of the owner, newest first, filtered by status, type, priority, site and creation day
 * and paged by the backend, which names their equipment, site and technician. The `alertId` query
 * parameter narrows the list to the corrective requests opened for that alert. With the `equipmentId`
 * query parameter it shows the intervention history of that equipment item instead.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Icon,
    InterventionSummary,
    Pagination,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
  ],
  selector: 'app-service-request-list',
  styleUrl: './service-request-list.css',
  templateUrl: './service-request-list.html',
})
export class ServiceRequestList {
  protected readonly store = inject(ServiceRequestsStore);
  protected readonly statusFilters: StatusFilter[] = ['ALL', ...Object.values(ServiceStatus)];
  protected readonly types = Object.values(ServiceType);
  protected readonly priorities = Object.values(ServicePriority);
  protected readonly statusAppearance = SERVICE_STATUS_APPEARANCE;
  protected readonly priorityAppearance = SERVICE_PRIORITY_APPEARANCE;
  /** The equipment whose intervention history is shown, or null to list the requests. */
  protected readonly equipmentFilter = this.equipmentIdParam();

  protected readonly statusFilter = computed<StatusFilter>(
    () => this.store.requestQuery().statuses[0] ?? 'ALL',
  );
  /** The type, priority, site and creation day filters, starting from the ones kept by the store. */
  protected readonly filters = inject(NonNullableFormBuilder).group(
    {
      type: [(this.store.requestQuery().types[0] ?? 'ALL') as ServiceType | 'ALL'],
      priority: [(this.store.requestQuery().priorities[0] ?? 'ALL') as ServicePriority | 'ALL'],
      siteId: [(this.store.requestQuery().siteId ?? 'ALL') as number | 'ALL'],
      from: [formatDay(this.store.requestQuery().createdFrom)],
      to: [formatDay(this.store.requestQuery().createdTo)],
    },
    { validators: orderedDays },
  );
  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });
  /** Whether the creation days are inverted, so they are not applied. */
  protected readonly invalidRange = computed(() => {
    this.filterValues();
    return this.filters.hasError('invalidRange');
  });
  /** The alert the list is narrowed to, or null. */
  protected readonly alertFilter = computed(() => this.store.requestQuery().sourceAlertId);
  protected readonly page = computed(() => this.store.requestQuery().page + 1);
  protected readonly pageCount = computed(() =>
    Math.max(1, this.store.requestPage()?.totalPages ?? 1),
  );
  protected readonly requests = computed(() => this.store.requestPage()?.items ?? []);
  protected readonly status = computed<ListStatus>(() => {
    if (this.store.requestsLoading()) {
      return 'loading';
    }
    if (this.store.requestsFailure() !== null) {
      return 'error';
    }
    return this.store.requestPage() === null ? 'loading' : 'ready';
  });
  /** Whether the owner has no requests at all, as opposed to none matching the filters. */
  protected readonly noRequestsYet = computed(() => {
    const query = this.store.requestQuery();
    return (
      query.statuses.length === 0 &&
      query.types.length === 0 &&
      query.priorities.length === 0 &&
      query.siteId === null &&
      query.createdFrom === null &&
      query.createdTo === null &&
      query.sourceAlertId === null &&
      query.page === 0
    );
  });

  protected readonly interventionsStatus = computed<ListStatus>(() => {
    if (this.store.interventionsLoading()) {
      return 'loading';
    }
    if (this.store.interventionsFailure() !== null) {
      return 'error';
    }
    return this.store.interventionsEquipmentId() === this.equipmentFilter ? 'ready' : 'loading';
  });
  protected readonly filteredEquipmentName = computed(() =>
    this.equipmentFilter === null
      ? null
      : (this.store.equipmentById().get(this.equipmentFilter)?.name ?? null),
  );

  constructor() {
    this.store.retain(inject(SHELL_LIFETIME));
    if (this.equipmentFilter === null) {
      // The sites name the site filter.
      this.store.loadEquipmentDirectory();
      this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.applyFilters());
      // The alert filter follows the URL, also when only the query parameter changes. The first
      // emission always loads the list; later ones only when the alert changes.
      let firstLoad = true;
      inject(ActivatedRoute)
        .queryParamMap.pipe(takeUntilDestroyed())
        .subscribe((params) => {
          const alertId = positiveId(params.get('alertId'));
          if (alertId !== this.store.requestQuery().sourceAlertId) {
            this.store.loadServiceRequests({ sourceAlertId: alertId });
          } else if (firstLoad) {
            this.store.loadServiceRequests();
          }
          firstLoad = false;
        });
    } else {
      // The intervention history names its equipment and technicians from the directories.
      this.store.loadEquipmentDirectory();
      this.store.loadTechnicianDirectory();
      this.store.loadEquipmentInterventions(this.equipmentFilter);
    }
  }

  /** Sends the filters of the form; inverted creation days are not applied. */
  private applyFilters(): void {
    const { type, priority, siteId, from, to } = this.filters.getRawValue();
    const fromDay = this.invalidRange() ? null : parseDay(from);
    const toDay = this.invalidRange() ? null : parseDay(to);
    this.store.loadServiceRequests({
      types: type === 'ALL' ? [] : [type],
      priorities: priority === 'ALL' ? [] : [priority],
      siteId: siteId === 'ALL' ? null : siteId,
      createdFrom: fromDay,
      // The whole last day is included: the backend bound is inclusive.
      createdTo: toDay === null ? null : new Date(toDay.getTime() + DAY_MS - 1),
    });
  }

  protected reload(): void {
    this.store.loadServiceRequests();
  }

  protected reloadInterventions(): void {
    if (this.equipmentFilter !== null) {
      this.store.loadEquipmentInterventions(this.equipmentFilter);
    }
  }

  protected setStatusFilter(status: StatusFilter): void {
    this.store.loadServiceRequests({ statuses: status === 'ALL' ? [] : [status] });
  }

  protected setPage(page: number): void {
    this.store.loadServiceRequests({ page: page - 1 });
  }

  protected clearFilters(): void {
    this.filters.setValue(
      { type: 'ALL', priority: 'ALL', siteId: 'ALL', from: '', to: '' },
      { emitEvent: false },
    );
    this.store.loadServiceRequests({
      statuses: [],
      types: [],
      priorities: [],
      siteId: null,
      createdFrom: null,
      createdTo: null,
    });
  }

  protected canAssign(request: ServiceRequestSummary): boolean {
    return awaitsAssignment(request);
  }

  private equipmentIdParam(): number | null {
    return positiveId(inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'));
  }
}
