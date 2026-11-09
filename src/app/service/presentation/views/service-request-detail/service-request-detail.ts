import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ServiceStatus } from '@service/domain/value-objects/service-status';
import type { ReviewScores } from '@service/application/contracts/review-scores';
import { isStaleStateFailure } from '@service/application/contracts/service-requests-error';
import { ServiceRequestsStore } from '@service/application/service-requests-store';
import { AssignTechnicianDialog } from '@service/presentation/components/assign-technician-dialog/assign-technician-dialog';
import { CancelRequestDialog } from '@service/presentation/components/cancel-request-dialog/cancel-request-dialog';
import { InterventionSummary } from '@service/presentation/components/intervention-summary/intervention-summary';
import { RequestProgress } from '@service/presentation/components/request-progress/request-progress';
import { ReviewDialog } from '@service/presentation/components/review-dialog/review-dialog';
import { StatusHistory } from '@service/presentation/components/status-history/status-history';
import {
  SERVICE_PRIORITY_APPEARANCE,
  SERVICE_STATUS_APPEARANCE,
} from '@service/presentation/service-request-appearance';
import {
  ACTION_SUCCESS_KEYS,
  actionErrorKey,
} from '@service/presentation/service-requests-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';

type DetailDialog = 'assign' | 'cancel' | 'review';

/** The states of the view while the request is not shown. */
type DetailStatus = 'loading' | 'error' | 'not-found' | 'ready';

/** How often the review edit window is checked against the clock, in milliseconds. */
const CLOCK_TICK_MS = 30_000;

/**
 * Detail of a service request: equipment and site, description, progress, status history, assigned
 * technician, intervention, maintenance windows and review. The owner assigns a technician, cancels the
 * request with a reason, or reviews the completed service and edits the review while the backend allows
 * it. Only the actions the request's state permits are offered; the backend remains the authority. The
 * `action` query parameter (`assign` or `review`) opens the matching dialog once the request allows it.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    AssignTechnicianDialog,
    CancelRequestDialog,
    Icon,
    InterventionSummary,
    RequestProgress,
    ReviewDialog,
    StatePanel,
    StatusHistory,
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
  protected readonly store = inject(ServiceRequestsStore);
  protected readonly statusAppearance = SERVICE_STATUS_APPEARANCE;
  protected readonly priorityAppearance = SERVICE_PRIORITY_APPEARANCE;

  private readonly requestId = signal(0);
  protected readonly dialog = signal<DetailDialog | null>(null);
  /** The dialog asked for by the `action` query parameter, until the request allows or refuses it. */
  private readonly requestedDialog = signal<DetailDialog | null>(null);
  private readonly now = signal(new Date());

  /** The loaded request when it is the one of the route; a request of another id is never shown. */
  protected readonly request = computed(() => {
    const request = this.store.selectedRequest();
    return request !== null && request.id === this.requestId() ? request : null;
  });
  protected readonly status = computed<DetailStatus>(() => {
    if (this.request() !== null) {
      return 'ready';
    }
    const failure = this.store.selectedRequestFailure();
    if (failure === 'NOT_FOUND') {
      return 'not-found';
    }
    return failure !== null && !this.store.selectedRequestLoading() ? 'error' : 'loading';
  });

  protected readonly equipmentName = computed(() => {
    const request = this.request();
    return request === null
      ? null
      : (this.store.equipmentById().get(request.equipment_id)?.name ?? null);
  });
  protected readonly siteName = computed(() => {
    const request = this.request();
    return request === null ? null : (this.store.siteById().get(request.site_id)?.name ?? null);
  });
  /** The public profile of the assigned technician, when it is the current one. */
  protected readonly technician = computed(() => {
    const technician = this.store.assignedTechnician();
    return technician !== null && technician.technicianId === this.request()?.technician_id
      ? technician
      : null;
  });
  /** The best known name of the assigned technician. */
  protected readonly technicianName = computed(() => {
    const technicianId = this.request()?.technician_id ?? null;
    if (technicianId === null) {
      return null;
    }
    return (
      this.technician()?.fullName ?? this.store.technicianById().get(technicianId)?.fullName ?? null
    );
  });
  protected readonly acceptedAt = computed(
    () => this.request()?.reachedAt(ServiceStatus.ACCEPTED) ?? null,
  );

  protected readonly review = computed(() => {
    const review = this.store.review();
    return review !== null && review.service_request_id === this.requestId() ? review : null;
  });
  protected readonly reviewEditable = computed(
    () => this.review()?.isEditableAt(this.now()) ?? false,
  );
  /** Whether the completed request can be reviewed: its review is known not to exist yet. */
  protected readonly canReview = computed(
    () =>
      this.request()?.canBeReviewed() === true &&
      !this.store.reviewLoading() &&
      this.store.reviewFailure() === null &&
      this.review() === null,
  );
  protected readonly reviewInitial = computed<ReviewScores | null>(() => {
    const review = this.review();
    return review === null ? null : { rating: review.rating, comment: review.comment };
  });

  /** The confirmation of the last successful action. */
  protected readonly announcementKey = computed(() => {
    const state = this.store.actionState();
    return state?.status === 'succeeded' ? ACTION_SUCCESS_KEYS[state.action] : null;
  });
  private readonly actionFailureKey = computed(() => {
    const state = this.store.actionState();
    return state?.status === 'failed' && state.failure !== null
      ? actionErrorKey(state.action, state.failure)
      : null;
  });
  /** The failure of the last action, shown in its dialog while it is open. */
  protected readonly dialogErrorKey = computed(() =>
    this.dialog() === null ? null : this.actionFailureKey(),
  );
  /** The failure of the last action, shown on the page once its dialog is closed. */
  protected readonly pageErrorKey = computed(() =>
    this.dialog() === null ? this.actionFailureKey() : null,
  );

  constructor() {
    this.store.loadEquipmentDirectory();
    this.store.loadTechnicianDirectory();

    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.requestId.set(Number(params.get('requestId')));
      this.load();
    });

    const action = this.route.snapshot.queryParamMap.get('action');
    this.requestedDialog.set(action === 'assign' || action === 'review' ? action : null);

    // A successful action, or a failure that made the request stale, closes its dialog.
    effect(() => {
      const state = this.store.actionState();
      if (
        state !== null &&
        (state.status === 'succeeded' ||
          (state.status === 'failed' &&
            state.failure !== null &&
            isStaleStateFailure(state.failure)))
      ) {
        untracked(() => this.dialog.set(null));
      }
    });

    // The dialog requested through the URL opens once the request (and its review) are known.
    effect(() => {
      const requested = this.requestedDialog();
      const request = this.request();
      if (requested === null || request === null) {
        return;
      }
      if (requested === 'assign') {
        untracked(() => this.openRequested(request.canBeAssigned() ? 'assign' : null));
      } else if (!request.canBeReviewed()) {
        untracked(() => this.openRequested(null));
      } else if (!this.store.reviewLoading()) {
        const canReview = this.canReview();
        untracked(() => this.openRequested(canReview ? 'review' : null));
      }
    });

    const clock = setInterval(() => this.now.set(new Date()), CLOCK_TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(clock));
  }

  protected load(): void {
    this.dialog.set(null);
    this.store.loadServiceRequest(this.requestId());
  }

  protected openDialog(dialog: DetailDialog): void {
    this.store.clearActionState();
    this.now.set(new Date());
    if (dialog === 'assign') {
      this.store.loadTechnicianCandidates();
    }
    this.dialog.set(dialog);
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    if (this.store.actionState()?.status === 'failed') {
      this.store.clearActionState();
    }
  }

  protected assign(technicianId: number): void {
    this.store.assignTechnician(technicianId);
  }

  protected cancel(reason: string): void {
    this.store.cancelServiceRequest(reason);
  }

  protected saveReview(scores: ReviewScores): void {
    if (this.review() === null) {
      this.store.submitReview(scores);
    } else {
      this.store.updateReview(scores);
    }
  }

  private openRequested(dialog: DetailDialog | null): void {
    this.requestedDialog.set(null);
    if (dialog !== null) {
      this.openDialog(dialog);
    }
  }
}
