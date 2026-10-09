import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Intervention } from '@service/domain/model/intervention.entity';
import { Review } from '@service/domain/model/review.entity';
import { ServiceRequest } from '@service/domain/model/service-request.entity';
import { InterventionStatus } from '@service/domain/value-objects/intervention-status';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import { AssignTechnicianDialog } from '@service/presentation/components/assign-technician-dialog/assign-technician-dialog';
import { CancelRequestDialog } from '@service/presentation/components/cancel-request-dialog/cancel-request-dialog';
import { RequestProgress } from '@service/presentation/components/request-progress/request-progress';
import {
  ReviewDialog,
  type ReviewSubmission,
} from '@service/presentation/components/review-dialog/review-dialog';
import {
  createInterventionsMock,
  createReviewsMock,
  createServiceRequestsMock,
  SERVICE_EQUIPMENT,
  TECHNICIAN_CANDIDATES,
} from '@service/presentation/mocks/service-requests.mock';
import {
  ASSIGNABLE_STATUSES,
  CANCELABLE_STATUSES,
  SERVICE_PRIORITY_APPEARANCE,
  SERVICE_STATUS_APPEARANCE,
} from '@service/presentation/service-request-appearance';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

type DetailDialog = 'assign' | 'cancel' | 'review';

/**
 * Detail of a service request: equipment and site, description, progress, assigned technician,
 * interventions and review. The owner assigns a technician, cancels the request with a reason or reviews
 * the completed service, when the request allows it. The `action` query parameter (`assign` or `review`)
 * opens the matching dialog.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    AssignTechnicianDialog,
    CancelRequestDialog,
    Icon,
    RequestProgress,
    ReviewDialog,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
    LocalizedNumberPipe,
  ],
  selector: 'app-service-request-detail',
  styleUrl: './service-request-detail.css',
  templateUrl: './service-request-detail.html',
})
export class ServiceRequestDetail {
  private readonly route = inject(ActivatedRoute);
  protected readonly source = injectMockDataSource();
  protected readonly statusAppearance = SERVICE_STATUS_APPEARANCE;
  protected readonly priorityAppearance = SERVICE_PRIORITY_APPEARANCE;
  protected readonly candidates = TECHNICIAN_CANDIDATES;
  protected readonly completedIntervention = InterventionStatus.COMPLETED;

  // The mocked mutations update the entity in place, so setting the same instance must notify.
  protected readonly request = signal<ServiceRequest | null>(null, { equal: () => false });
  protected readonly interventions = signal<Intervention[]>([]);
  protected readonly review = signal<Review | null>(null);
  protected readonly dialog = signal<DetailDialog | null>(null);
  /** The translation key of the outcome of the last action, announced to assistive technologies. */
  protected readonly announcement = signal<string | null>(null);

  protected readonly equipment = computed(() => {
    const request = this.request();
    return SERVICE_EQUIPMENT.find((item) => item.id === request?.equipment_id) ?? null;
  });
  protected readonly technician = computed(() => {
    const request = this.request();
    return (
      TECHNICIAN_CANDIDATES.find(
        (candidate) => candidate.technicianProfileId === request?.technician_profile_id,
      ) ?? null
    );
  });
  protected readonly canCancel = computed(() => {
    const request = this.request();
    return request !== null && CANCELABLE_STATUSES.has(request.status);
  });
  protected readonly canAssign = computed(() => {
    const request = this.request();
    return request !== null && ASSIGNABLE_STATUSES.has(request.status);
  });
  protected readonly canReview = computed(
    () => this.request()?.status === ServiceStatus.COMPLETED && this.review() === null,
  );
  protected readonly completed = computed(() => this.request()?.status === ServiceStatus.COMPLETED);
  protected readonly awaitingAcceptance = computed(
    () => this.request()?.status === ServiceStatus.PENDING && this.technician() !== null,
  );
  protected readonly startedAt = computed(() => this.interventions()[0]?.start_time ?? null);

  private requestId = 0;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.requestId = Number(params.get('requestId'));
      this.load();
    });
  }

  protected load(): void {
    this.dialog.set(null);
    this.announcement.set(null);
    this.source.load((empty) => {
      const request = empty
        ? undefined
        : createServiceRequestsMock().find((item) => item.id === this.requestId);
      this.request.set(request ?? null);
      this.interventions.set(
        createInterventionsMock().filter((item) => item.service_request_id === this.requestId),
      );
      this.review.set(
        createReviewsMock().find((item) => item.service_request_id === this.requestId) ?? null,
      );
      this.openRequestedDialog();
    });
  }

  protected openDialog(dialog: DetailDialog): void {
    this.announcement.set(null);
    this.dialog.set(dialog);
  }

  protected assign(technicianProfileId: number): void {
    const request = this.request();
    if (!request) {
      return;
    }
    // TODO: Delegate to the service requests store (assign technician use case). The request waits for
    // the technician to accept it, so the mock leaves it pending.
    this.source.mutate(() => {
      request.technician_profile_id = technicianProfileId;
      request.status = ServiceStatus.PENDING;
      this.request.set(request);
      this.dialog.set(null);
      this.announcement.set('serviceRequests.detail.assigned');
    });
  }

  /**
   * TODO: Delegate to the service requests store (cancel service request use case). The class diagram
   * has no field for the cancellation reason, so it is collected but not kept yet.
   */
  protected cancel(reason: string): void {
    const request = this.request();
    if (!request || reason === '') {
      return;
    }
    this.source.mutate(() => {
      request.status = ServiceStatus.CANCELED;
      request.canceled_at = new Date();
      this.request.set(request);
      this.dialog.set(null);
      this.announcement.set('serviceRequests.detail.canceled');
    });
  }

  protected submitReview(submission: ReviewSubmission): void {
    const request = this.request();
    if (!request || request.technician_profile_id === null) {
      return;
    }
    const technicianProfileId = request.technician_profile_id;
    // TODO: Delegate to the service requests store (create review use case).
    this.source.mutate(() => {
      this.review.set(
        new Review({
          id: request.id * 10 + 1,
          service_request_id: request.id,
          technician_profile_id: technicianProfileId,
          rating: submission.rating,
          comment: submission.comment,
        }),
      );
      this.dialog.set(null);
      this.announcement.set('serviceRequests.detail.reviewed');
    });
  }

  private openRequestedDialog(): void {
    const action = this.route.snapshot.queryParamMap.get('action');
    if (action === 'assign' && this.canAssign()) {
      this.dialog.set('assign');
    } else if (action === 'review' && this.canReview()) {
      this.dialog.set('review');
    }
  }
}
