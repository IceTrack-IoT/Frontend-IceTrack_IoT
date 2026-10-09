import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { Review } from '@service/domain/model/review.entity';
import { ServiceRequest } from '@service/domain/model/service-request.entity';
import { ServicePriority } from '@service/domain/value-objects/service-priority';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import { ServiceType } from '@service/domain/value-objects/service-type';
import {
  createReviewsMock,
  createServiceRequestsMock,
  SERVICE_EQUIPMENT,
  TECHNICIAN_CANDIDATES,
} from '@service/presentation/mocks/service-requests.mock';
import {
  ASSIGNABLE_STATUSES,
  SERVICE_PRIORITY_APPEARANCE,
  SERVICE_STATUS_APPEARANCE,
} from '@service/presentation/service-request-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import {
  pageCountOf,
  pageOf,
  Pagination,
} from '@shared/presentation/components/pagination/pagination';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';

const PAGE_SIZE = 6;

type StatusFilter = ServiceStatus | 'ALL';

/**
 * Service requests of the owner, filtered by status, priority and type. The `equipmentId` query parameter
 * shows the service history of one equipment item.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Icon,
    Pagination,
    StatePanel,
    StatusTag,
  ],
  selector: 'app-service-request-list',
  styleUrl: './service-request-list.css',
  templateUrl: './service-request-list.html',
})
export class ServiceRequestList {
  protected readonly source = injectMockDataSource();
  protected readonly statusFilters: StatusFilter[] = ['ALL', ...Object.values(ServiceStatus)];
  protected readonly priorities = Object.values(ServicePriority);
  protected readonly types = Object.values(ServiceType);
  protected readonly statusAppearance = SERVICE_STATUS_APPEARANCE;
  protected readonly priorityAppearance = SERVICE_PRIORITY_APPEARANCE;
  protected readonly equipmentById = new Map(SERVICE_EQUIPMENT.map((item) => [item.id, item]));
  protected readonly technicianById = new Map(
    TECHNICIAN_CANDIDATES.map((technician) => [technician.technicianProfileId, technician]),
  );
  protected readonly equipmentFilter = this.equipmentIdParam();

  protected readonly filters = inject(NonNullableFormBuilder).group({
    priority: ['ALL' as ServicePriority | 'ALL'],
    type: ['ALL' as ServiceType | 'ALL'],
  });
  private readonly filterValue = toSignal(
    this.filters.valueChanges.pipe(map(() => this.filters.getRawValue())),
    { initialValue: this.filters.getRawValue() },
  );

  private readonly requests = signal<ServiceRequest[]>([]);
  private readonly reviews = signal<Review[]>([]);
  protected readonly statusFilter = signal<StatusFilter>('ALL');
  protected readonly page = signal(1);

  protected readonly scoped = computed(() =>
    this.requests().filter(
      (request) => this.equipmentFilter === null || request.equipment_id === this.equipmentFilter,
    ),
  );
  protected readonly statusCounts = computed(() => {
    const counts = new Map<StatusFilter, number>([['ALL', this.scoped().length]]);
    for (const request of this.scoped()) {
      counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
    }
    return counts;
  });
  protected readonly filtered = computed(() => {
    const status = this.statusFilter();
    const { priority, type } = this.filterValue();
    return this.scoped().filter(
      (request) =>
        (status === 'ALL' || request.status === status) &&
        (priority === 'ALL' || request.priority === priority) &&
        (type === 'ALL' || request.type === type),
    );
  });
  protected readonly reviewedRequestIds = computed(
    () => new Set(this.reviews().map((review) => review.service_request_id)),
  );
  protected readonly pageCount = computed(() => pageCountOf(this.filtered().length, PAGE_SIZE));
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  constructor() {
    this.filters.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.page.set(1));
    this.load();
  }

  protected load(): void {
    this.source.load((empty) => {
      this.requests.set(empty ? [] : createServiceRequestsMock());
      this.reviews.set(empty ? [] : createReviewsMock());
    });
  }

  protected setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.filters.reset();
    this.setStatusFilter('ALL');
  }

  protected canAssign(request: ServiceRequest): boolean {
    return ASSIGNABLE_STATUSES.has(request.status) && request.technician_profile_id === null;
  }

  protected canReview(request: ServiceRequest): boolean {
    return request.status === ServiceStatus.COMPLETED && !this.reviewedRequestIds().has(request.id);
  }

  private equipmentIdParam(): number | null {
    const equipmentId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('equipmentId'));
    return Number.isInteger(equipmentId) && equipmentId > 0 ? equipmentId : null;
  }
}
