import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';

type StatusFilter = ServiceStatus | 'ALL';

/** The asynchronous states of the request table while it is not populated. */
type ListStatus = 'loading' | 'error' | 'ready';

/**
 * Service requests of the owner, newest first, filtered by status, type and priority and paged by the
 * backend, which names their equipment, site and technician. With the `equipmentId` query parameter it
 * shows the intervention history of that equipment item instead.
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
  /** The type and priority filters, starting from the ones kept by the store. */
  protected readonly filters = inject(NonNullableFormBuilder).group({
    type: [(this.store.requestQuery().types[0] ?? 'ALL') as ServiceType | 'ALL'],
    priority: [(this.store.requestQuery().priorities[0] ?? 'ALL') as ServicePriority | 'ALL'],
  });
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
    const { statuses, types, priorities, page } = this.store.requestQuery();
    return statuses.length === 0 && types.length === 0 && priorities.length === 0 && page === 0;
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
    if (this.equipmentFilter === null) {
      this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(({ type, priority }) =>
        this.store.loadServiceRequests({
          types: type === undefined || type === 'ALL' ? [] : [type],
          priorities: priority === undefined || priority === 'ALL' ? [] : [priority],
        }),
      );
      this.store.loadServiceRequests();
    } else {
      // The intervention history names its equipment and technicians from the directories.
      this.store.loadEquipmentDirectory();
      this.store.loadTechnicianDirectory();
      this.store.loadEquipmentInterventions(this.equipmentFilter);
    }
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
    this.filters.setValue({ type: 'ALL', priority: 'ALL' }, { emitEvent: false });
    this.store.loadServiceRequests({ statuses: [], types: [], priorities: [] });
  }

  protected canAssign(request: ServiceRequestSummary): boolean {
    return awaitsAssignment(request);
  }

  private equipmentIdParam(): number | null {
    const equipmentId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'));
    return Number.isInteger(equipmentId) && equipmentId > 0 ? equipmentId : null;
  }
}
