import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
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
 * Service requests of the owner, newest first, filtered by status and paged by the backend. With the
 * `equipmentId` query parameter it shows the intervention history of that equipment item instead.
 */
@Component({
  imports: [
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
  protected readonly statusAppearance = SERVICE_STATUS_APPEARANCE;
  protected readonly priorityAppearance = SERVICE_PRIORITY_APPEARANCE;
  /** The equipment whose intervention history is shown, or null to list the requests. */
  protected readonly equipmentFilter = this.equipmentIdParam();

  protected readonly statusFilter = computed<StatusFilter>(
    () => this.store.requestQuery().statuses[0] ?? 'ALL',
  );
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
  /** Whether the owner has no requests at all, as opposed to none matching the filter. */
  protected readonly noRequestsYet = computed(
    () => this.statusFilter() === 'ALL' && this.store.requestQuery().page === 0,
  );

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
    this.store.loadEquipmentDirectory();
    this.store.loadTechnicianDirectory();
    if (this.equipmentFilter === null) {
      this.store.loadServiceRequests();
    } else {
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
    this.setStatusFilter('ALL');
  }

  protected canAssign(request: ServiceRequest): boolean {
    return request.canBeAssigned() && request.technician_id === null;
  }

  private equipmentIdParam(): number | null {
    const equipmentId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'));
    return Number.isInteger(equipmentId) && equipmentId > 0 ? equipmentId : null;
  }
}
