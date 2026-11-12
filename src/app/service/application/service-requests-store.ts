import {
  computed,
  type DestroyRef,
  inject,
  Injectable,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { finalize, Observable, Subscription } from 'rxjs';
import type { Intervention } from '@service/domain/model/intervention.entity';
import type { Review } from '@service/domain/model/review.entity';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import type { NewServiceRequest } from '@service/application/contracts/new-service-request';
import type { ReviewScores } from '@service/application/contracts/review-scores';
import type {
  ServiceEquipment,
  ServiceEquipmentDirectory,
  ServiceSite,
} from '@service/application/contracts/service-equipment';
import type {
  ServiceRequestPage,
  ServiceRequestQuery,
  ServiceRequestSummary,
} from '@service/application/contracts/service-request-page';
import {
  isStaleStateFailure,
  type ServiceRequestsFailure,
  toServiceRequestsFailure,
} from '@service/application/contracts/service-requests-error';
import type {
  TechnicianCandidate,
  TechnicianSummary,
} from '@service/application/contracts/technician-candidate';
import { AssignTechnicianUseCase } from '@service/application/use-cases/assign-technician.use-case';
import { CancelServiceRequestUseCase } from '@service/application/use-cases/cancel-service-request.use-case';
import { CreateServiceRequestUseCase } from '@service/application/use-cases/create-service-request.use-case';
import { LoadAssignedTechnicianUseCase } from '@service/application/use-cases/load-assigned-technician.use-case';
import { LoadEquipmentInterventionsUseCase } from '@service/application/use-cases/load-equipment-interventions.use-case';
import { LoadServiceEquipmentUseCase } from '@service/application/use-cases/load-service-equipment.use-case';
import { LoadServiceRequestUseCase } from '@service/application/use-cases/load-service-request.use-case';
import { LoadServiceRequestsUseCase } from '@service/application/use-cases/load-service-requests.use-case';
import { LoadServiceReviewUseCase } from '@service/application/use-cases/load-service-review.use-case';
import { LoadTechnicianCandidatesUseCase } from '@service/application/use-cases/load-technician-candidates.use-case';
import { LoadTechnicianDirectoryUseCase } from '@service/application/use-cases/load-technician-directory.use-case';
import { SubmitServiceReviewUseCase } from '@service/application/use-cases/submit-service-review.use-case';
import { UpdateServiceReviewUseCase } from '@service/application/use-cases/update-service-review.use-case';
import { GenerateServiceReportUseCase } from '@service/application/use-cases/generate-service-report.use-case';

/** The number of service requests per page of the list. */
export const SERVICE_REQUEST_PAGE_SIZE = 10;

/** The filters of the request list the owner sets; the page and its size are chosen separately. */
export type ServiceRequestFilters = Omit<ServiceRequestQuery, 'equipmentId' | 'page' | 'size'>;

const SERVICE_REQUEST_FILTER_KEYS: readonly (keyof ServiceRequestFilters)[] = [
  'statuses',
  'types',
  'priorities',
  'siteId',
  'createdFrom',
  'createdTo',
  'sourceAlertId',
];

/** The actions the owner runs on the selected service request. */
export type ServiceRequestAction = 'assign' | 'cancel' | 'submit-review' | 'update-review';

/**
 * The outcome of the last action on the selected service request. A failure meaning the local state was
 * stale has already triggered a reload of the request when it is exposed.
 */
export interface ServiceReportState {
  readonly serviceRequestId: number;
  readonly status: 'pending' | 'succeeded' | 'failed';
  /** The identifier of the report that documents the request, once it was accepted. */
  readonly reportId: number | null;
}

/** The outcome of the last action on the selected request, until it is cleared. */
export interface ServiceRequestActionState {
  readonly action: ServiceRequestAction;
  readonly status: 'pending' | 'succeeded' | 'failed';
  readonly failure: ServiceRequestsFailure | null;
}

/** The state of an asynchronous read: its data, whether it is in progress and why it last failed. */
interface ReadState<T> {
  readonly value: WritableSignal<T>;
  readonly loading: WritableSignal<boolean>;
  readonly failure: WritableSignal<ServiceRequestsFailure | null>;
}

function readState<T>(initial: T): ReadState<T> {
  return {
    value: signal(initial),
    loading: signal(false),
    failure: signal<ServiceRequestsFailure | null>(null),
  };
}

function resetReadState<T>(state: ReadState<T>, initial: T): void {
  state.value.set(initial);
  state.loading.set(false);
  state.failure.set(null);
}

/** The list query of a new session: no filter, first page. */
const INITIAL_SERVICE_REQUEST_QUERY: ServiceRequestQuery = {
  statuses: [],
  types: [],
  priorities: [],
  equipmentId: null,
  siteId: null,
  createdFrom: null,
  createdTo: null,
  sourceAlertId: null,
  page: 0,
  size: SERVICE_REQUEST_PAGE_SIZE,
};

/**
 * Service Requests Store manages the owner's service requests: the filtered list, the selected request
 * with its review and assigned technician, the technician candidates for an assignment, the intervention
 * history of an equipment item, and the equipment, sites and technicians the requests refer to.
 *
 * It holds signal-based state only and delegates every operation to Service Request Management use cases.
 * Equipment and sites come from Assets and technicians from Profiles, through read-only ports. The loaded
 * state is kept for the owner session the views retain it for, so a view opened again shows it at once
 * while it is read again; once that session ends, every operation in progress stops and everything is
 * discarded.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceRequestsStore {
  private readonly loadServiceRequestsUseCase = inject(LoadServiceRequestsUseCase);
  private readonly loadServiceRequestUseCase = inject(LoadServiceRequestUseCase);
  private readonly createServiceRequestUseCase = inject(CreateServiceRequestUseCase);
  private readonly assignTechnicianUseCase = inject(AssignTechnicianUseCase);
  private readonly cancelServiceRequestUseCase = inject(CancelServiceRequestUseCase);
  private readonly loadServiceReviewUseCase = inject(LoadServiceReviewUseCase);
  private readonly submitServiceReviewUseCase = inject(SubmitServiceReviewUseCase);
  private readonly updateServiceReviewUseCase = inject(UpdateServiceReviewUseCase);
  private readonly loadEquipmentInterventionsUseCase = inject(LoadEquipmentInterventionsUseCase);
  private readonly loadServiceEquipmentUseCase = inject(LoadServiceEquipmentUseCase);
  private readonly loadTechnicianDirectoryUseCase = inject(LoadTechnicianDirectoryUseCase);
  private readonly loadTechnicianCandidatesUseCase = inject(LoadTechnicianCandidatesUseCase);
  private readonly loadAssignedTechnicianUseCase = inject(LoadAssignedTechnicianUseCase);
  private readonly generateServiceReportUseCase = inject(GenerateServiceReportUseCase);

  // List.
  private readonly queryState = signal<ServiceRequestQuery>(INITIAL_SERVICE_REQUEST_QUERY);
  /** The filters and page of the list, kept while the owner navigates away and back. */
  readonly requestQuery = this.queryState.asReadonly();
  private readonly pageState = readState<ServiceRequestPage | null>(null);
  /** The current page of the list, or null until one is loaded. */
  readonly requestPage = this.pageState.value.asReadonly();
  readonly requestsLoading = this.pageState.loading.asReadonly();
  readonly requestsFailure = this.pageState.failure.asReadonly();

  // Directories of the data the requests refer to.
  private readonly equipmentState = readState<ServiceEquipmentDirectory | null>(null);
  /** The owner's equipment, sorted by name. */
  readonly equipment = computed(() => this.equipmentState.value()?.equipment ?? []);
  readonly equipmentLoaded = computed(() => this.equipmentState.value() !== null);
  readonly equipmentLoading = this.equipmentState.loading.asReadonly();
  readonly equipmentFailure = this.equipmentState.failure.asReadonly();
  /** The owner's equipment by id. */
  readonly equipmentById: Signal<ReadonlyMap<number, ServiceEquipment>> = computed(
    () => new Map(this.equipment().map((item) => [item.id, item])),
  );
  /** The owner's sites, sorted by name. */
  readonly sites = computed(() =>
    [...(this.equipmentState.value()?.sites ?? [])].sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
  );
  /** The owner's sites by id. */
  readonly siteById: Signal<ReadonlyMap<number, ServiceSite>> = computed(
    () => new Map((this.equipmentState.value()?.sites ?? []).map((site) => [site.id, site])),
  );

  private readonly techniciansState = readState<readonly TechnicianSummary[]>([]);
  /** The technician directory by technician profile id. */
  readonly technicianById: Signal<ReadonlyMap<number, TechnicianSummary>> = computed(
    () => new Map(this.techniciansState.value().map((item) => [item.technicianId, item])),
  );
  readonly techniciansFailure = this.techniciansState.failure.asReadonly();

  // Selected request.
  private readonly selectedState = readState<ServiceRequest | null>(null);
  /** The request last loaded for the detail, or null while none is loaded. */
  readonly selectedRequest = this.selectedState.value.asReadonly();
  readonly selectedRequestLoading = this.selectedState.loading.asReadonly();
  /** Why the request could not be loaded; `NOT_FOUND` when it does not exist or is not the owner's. */
  readonly selectedRequestFailure = this.selectedState.failure.asReadonly();

  private readonly reviewState = readState<Review | null>(null);
  /** The review of the selected request, or null when it has none (or it is not completed). */
  readonly review = this.reviewState.value.asReadonly();
  readonly reviewLoading = this.reviewState.loading.asReadonly();
  readonly reviewFailure = this.reviewState.failure.asReadonly();

  private readonly assignedTechnicianState = readState<TechnicianCandidate | null>(null);
  /** The public profile of the technician assigned to the selected request. */
  readonly assignedTechnician = this.assignedTechnicianState.value.asReadonly();
  readonly assignedTechnicianLoading = this.assignedTechnicianState.loading.asReadonly();
  readonly assignedTechnicianFailure = this.assignedTechnicianState.failure.asReadonly();

  private readonly actionStateSignal = signal<ServiceRequestActionState | null>(null);
  /** The outcome of the last action on the selected request, until it is cleared. */
  readonly actionState = this.actionStateSignal.asReadonly();
  readonly actionPending = computed(() => this.actionStateSignal()?.status === 'pending');

  private readonly serviceReportSignal = signal<ServiceReportState | null>(null);
  /** The last request of the document of a completed service request, until it is cleared. */
  readonly serviceReport = this.serviceReportSignal.asReadonly();
  readonly serviceReportPending = computed(() => this.serviceReportSignal()?.status === 'pending');

  // Technician candidates.
  private readonly candidatesState = readState<readonly TechnicianCandidate[]>([]);
  readonly technicianCandidates = this.candidatesState.value.asReadonly();
  readonly technicianCandidatesLoading = this.candidatesState.loading.asReadonly();
  readonly technicianCandidatesFailure = this.candidatesState.failure.asReadonly();

  // Equipment intervention history.
  private readonly interventionsState = readState<readonly Intervention[]>([]);
  private readonly interventionsEquipmentIdSignal = signal<number | null>(null);
  readonly interventions = this.interventionsState.value.asReadonly();
  /** The equipment the loaded interventions belong to. */
  readonly interventionsEquipmentId = this.interventionsEquipmentIdSignal.asReadonly();
  readonly interventionsLoading = this.interventionsState.loading.asReadonly();
  readonly interventionsFailure = this.interventionsState.failure.asReadonly();

  // Creation.
  private readonly createdRequestSignal = signal<ServiceRequest | null>(null);
  /** The request created last, until the confirmation is dismissed. */
  readonly createdRequest = this.createdRequestSignal.asReadonly();
  private readonly creatingSignal = signal(false);
  readonly creating = this.creatingSignal.asReadonly();
  private readonly createFailureSignal = signal<ServiceRequestsFailure | null>(null);
  readonly createFailure = this.createFailureSignal.asReadonly();

  private pageSubscription: Subscription | null = null;
  private selectedSubscription: Subscription | null = null;
  private reviewSubscription: Subscription | null = null;
  private assignedTechnicianSubscription: Subscription | null = null;
  private interventionsSubscription: Subscription | null = null;
  /** Every read and write of the session in progress, stopped when the session ends. */
  private sessionWork = new Subscription();
  private retainedSession: DestroyRef | null = null;

  /**
   * Keeps the loaded state until the owner session ends; then every operation in progress stops and the
   * state is discarded, so nothing reaches the next session.
   * @param session - The lifetime of the owner session.
   */
  retain(session: DestroyRef): void {
    if (this.retainedSession === session) {
      return;
    }
    this.retainedSession = session;
    session.onDestroy(() => {
      if (this.retainedSession === session) {
        this.retainedSession = null;
        this.release();
      }
    });
  }

  /**
   * Loads a page of the owner's service requests. A newer load supersedes one still in progress.
   * @param change - The filters or page to apply; the rest of the current query is kept. Changing any
   * filter returns to the first page.
   */
  loadServiceRequests(
    change: Partial<ServiceRequestFilters & Pick<ServiceRequestQuery, 'page'>> = {},
  ): void {
    const filtersChanged = SERVICE_REQUEST_FILTER_KEYS.some((key) => change[key] !== undefined);
    this.queryState.update((query) => ({
      ...query,
      ...change,
      page: change.page ?? (filtersChanged ? 0 : query.page),
    }));
    this.pageSubscription?.unsubscribe();
    this.pageSubscription = this.run(
      this.loadServiceRequestsUseCase.execute(this.queryState()),
      this.pageState,
      (page) => this.pageState.value.set(page),
    );
  }

  /**
   * Loads the owner's equipment and sites, keeping the ones in memory until the new ones arrive.
   */
  loadEquipmentDirectory(): void {
    this.run(this.loadServiceEquipmentUseCase.execute(), this.equipmentState, (directory) =>
      this.equipmentState.value.set(directory),
    );
  }

  /**
   * Loads the technician directory, keeping the one in memory until the new one arrives.
   */
  loadTechnicianDirectory(): void {
    this.run(this.loadTechnicianDirectoryUseCase.execute(), this.techniciansState, (technicians) =>
      this.techniciansState.value.set(technicians),
    );
  }

  /**
   * Loads a service request for the detail, then its review when it is completed and its assigned
   * technician when it has one. A request of another id is discarded first, so it is never shown as
   * this one.
   * @param serviceRequestId - The identifier of the service request.
   */
  loadServiceRequest(serviceRequestId: number): void {
    if (this.selectedState.value()?.id !== serviceRequestId) {
      this.selectedState.value.set(null);
      this.reviewState.value.set(null);
      this.reviewState.failure.set(null);
      this.assignedTechnicianState.value.set(null);
      this.assignedTechnicianState.failure.set(null);
      this.actionStateSignal.set(null);
      this.clearServiceReport();
    }
    this.selectedSubscription?.unsubscribe();
    this.selectedSubscription = this.run(
      this.loadServiceRequestUseCase.execute(serviceRequestId),
      this.selectedState,
      (request) => this.applySelectedRequest(request, true),
    );
  }

  /**
   * Loads the review of the selected request again.
   */
  loadReview(): void {
    const request = this.selectedState.value();
    if (request !== null) {
      this.loadReviewOf(request);
    }
  }

  /**
   * Loads the public profile of the technician assigned to the selected request again.
   */
  loadAssignedTechnician(): void {
    const technicianId = this.selectedState.value()?.technician_id ?? null;
    if (technicianId !== null) {
      this.loadAssignedTechnicianById(technicianId);
    }
  }

  /**
   * Loads the technicians the owner can assign, with their statistics.
   */
  loadTechnicianCandidates(): void {
    this.run(this.loadTechnicianCandidatesUseCase.execute(), this.candidatesState, (candidates) =>
      this.candidatesState.value.set(candidates),
    );
  }

  /**
   * Loads the intervention history of an equipment item. The history of another item is discarded
   * first.
   * @param equipmentId - The identifier of the equipment.
   */
  loadEquipmentInterventions(equipmentId: number): void {
    if (this.interventionsEquipmentIdSignal() !== equipmentId) {
      this.interventionsState.value.set([]);
    }
    this.interventionsEquipmentIdSignal.set(equipmentId);
    this.interventionsSubscription?.unsubscribe();
    this.interventionsSubscription = this.run(
      this.loadEquipmentInterventionsUseCase.execute(equipmentId),
      this.interventionsState,
      (interventions) => this.interventionsState.value.set(interventions),
    );
  }

  /**
   * Creates a service request. A request asked for while another one is being created is ignored, so a
   * double submission never creates two requests.
   * @param request - The data of the new request.
   */
  createServiceRequest(request: NewServiceRequest): void {
    if (this.creatingSignal()) {
      return;
    }
    this.creatingSignal.set(true);
    this.createFailureSignal.set(null);
    this.track(
      this.createServiceRequestUseCase
        .execute(request)
        .pipe(finalize(() => this.creatingSignal.set(false))),
    ).subscribe({
      next: (created) => this.createdRequestSignal.set(created),
      error: (error: unknown) => this.createFailureSignal.set(toServiceRequestsFailure(error)),
    });
  }

  /**
   * Dismisses the confirmation and the failure of the last creation.
   */
  clearCreation(): void {
    this.createdRequestSignal.set(null);
    this.createFailureSignal.set(null);
  }

  /**
   * Assigns a technician to the selected request, replacing the current one.
   * @param technicianId - The identifier of the technician profile.
   */
  assignTechnician(technicianId: number): void {
    const request = this.selectedState.value();
    if (request === null) {
      return;
    }
    this.runAction(
      'assign',
      this.assignTechnicianUseCase.execute(request.id, technicianId),
      (updated) => this.applySelectedRequest(updated, false),
    );
  }

  /**
   * Cancels the selected request.
   * @param reason - Why the owner cancels.
   */
  cancelServiceRequest(reason: string): void {
    const request = this.selectedState.value();
    if (request === null) {
      return;
    }
    this.runAction(
      'cancel',
      this.cancelServiceRequestUseCase.execute(request.id, reason),
      (updated) => this.applySelectedRequest(updated, false),
    );
  }

  /**
   * Submits the review of the selected request.
   * @param scores - The scores and optional comment.
   */
  submitReview(scores: ReviewScores): void {
    const request = this.selectedState.value();
    if (request === null) {
      return;
    }
    this.runAction(
      'submit-review',
      this.submitServiceReviewUseCase.execute(request.id, scores),
      (review) => this.reviewState.value.set(review),
    );
  }

  /**
   * Replaces the scores and comment of the review of the selected request.
   * @param scores - The new scores and optional comment.
   */
  updateReview(scores: ReviewScores): void {
    const review = this.reviewState.value();
    if (review === null) {
      return;
    }
    this.runAction(
      'update-review',
      this.updateServiceReviewUseCase.execute(review.id, scores),
      (updated) => this.reviewState.value.set(updated),
    );
  }

  /**
   * Requests the document of the selected request once it is completed. The document is generated and
   * served by Reporting, which the owner opens with the identifier kept here.
   * @param name - The display name of the document.
   */
  requestServiceReport(name: string): void {
    const request = this.selectedState.value();
    if (request === null || this.serviceReportPending()) {
      return;
    }
    const serviceRequestId = request.id;
    this.serviceReportSignal.set({ serviceRequestId, status: 'pending', reportId: null });
    this.track(this.generateServiceReportUseCase.execute(request, name)).subscribe({
      next: (reportId) =>
        this.serviceReportSignal.set({ serviceRequestId, status: 'succeeded', reportId }),
      error: () =>
        this.serviceReportSignal.set({ serviceRequestId, status: 'failed', reportId: null }),
    });
  }

  /**
   * Clears the outcome of the last document request.
   */
  clearServiceReport(): void {
    if (!this.serviceReportPending()) {
      this.serviceReportSignal.set(null);
    }
  }

  /**
   * Clears the outcome of the last action on the selected request.
   */
  clearActionState(): void {
    if (!this.actionPending()) {
      this.actionStateSignal.set(null);
    }
  }

  /**
   * Shows a loaded request as the selected one, keeps the list consistent and loads what depends on it.
   * @param request - The loaded or updated request.
   * @param reloadReview - Whether the review must be read again.
   */
  private applySelectedRequest(request: ServiceRequest, reloadReview: boolean): void {
    const previousTechnicianId = this.selectedState.value()?.technician_id ?? null;
    this.selectedState.value.set(request);
    this.pageState.value.update((page) =>
      page === null
        ? page
        : {
            ...page,
            items: page.items.map((item) =>
              item.id === request.id ? withRequest(item, request) : item,
            ),
          },
    );

    if (request.technician_id === null) {
      this.assignedTechnicianSubscription?.unsubscribe();
      this.assignedTechnicianState.value.set(null);
      this.assignedTechnicianState.failure.set(null);
    } else if (
      request.technician_id !== previousTechnicianId ||
      this.assignedTechnicianState.value()?.technicianId !== request.technician_id
    ) {
      this.loadAssignedTechnicianById(request.technician_id);
    }

    if (!request.canBeReviewed()) {
      this.reviewSubscription?.unsubscribe();
      this.reviewState.value.set(null);
      this.reviewState.failure.set(null);
    } else if (reloadReview) {
      this.loadReviewOf(request);
    }
  }

  private loadReviewOf(request: ServiceRequest): void {
    if (!request.canBeReviewed()) {
      return;
    }
    this.reviewSubscription?.unsubscribe();
    this.reviewSubscription = this.run(
      this.loadServiceReviewUseCase.execute(request.id),
      this.reviewState,
      (review) => this.reviewState.value.set(review),
    );
  }

  private loadAssignedTechnicianById(technicianId: number): void {
    if (this.assignedTechnicianState.value()?.technicianId !== technicianId) {
      this.assignedTechnicianState.value.set(null);
    }
    this.assignedTechnicianSubscription?.unsubscribe();
    this.assignedTechnicianSubscription = this.run(
      this.loadAssignedTechnicianUseCase.execute(technicianId),
      this.assignedTechnicianState,
      (technician) => this.assignedTechnicianState.value.set(technician),
    );
  }

  /**
   * Runs an action on the selected request. An action asked for while another one is pending is
   * ignored. When the backend reports the local state as stale, the request and its review are read
   * again before the failure is exposed.
   */
  private runAction<T>(
    action: ServiceRequestAction,
    operation: Observable<T>,
    apply: (result: T) => void,
  ): void {
    if (this.actionPending()) {
      return;
    }
    this.actionStateSignal.set({ action, status: 'pending', failure: null });
    this.track(operation).subscribe({
      next: (result) => {
        apply(result);
        this.actionStateSignal.set({ action, status: 'succeeded', failure: null });
      },
      error: (error: unknown) => {
        const failure = toServiceRequestsFailure(error);
        this.actionStateSignal.set({ action, status: 'failed', failure });
        const request = this.selectedState.value();
        if (isStaleStateFailure(failure) && request !== null) {
          this.loadServiceRequest(request.id);
        }
      },
    });
  }

  /**
   * Runs a read: tracks it as in progress, clears its previous failure and applies its result, or keeps
   * the current state and records the failure.
   */
  private run<T>(
    operation: Observable<T>,
    state: Pick<ReadState<unknown>, 'loading' | 'failure'>,
    apply: (result: T) => void,
  ): Subscription {
    state.loading.set(true);
    state.failure.set(null);
    return this.track(operation.pipe(finalize(() => state.loading.set(false)))).subscribe({
      next: apply,
      error: (error: unknown) => state.failure.set(toServiceRequestsFailure(error)),
    });
  }

  /** Runs an operation within the session, so it stops when the session ends. */
  private track<T>(operation: Observable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      const subscription = operation.subscribe(subscriber);
      this.sessionWork.add(subscription);
      return () => {
        subscription.unsubscribe();
        this.sessionWork.remove(subscription);
      };
    });
  }

  /** Stops every operation in progress and discards every loaded value once the session ends. */
  private release(): void {
    this.sessionWork.unsubscribe();
    this.sessionWork = new Subscription();
    this.pageSubscription = null;
    this.selectedSubscription = null;
    this.reviewSubscription = null;
    this.assignedTechnicianSubscription = null;
    this.interventionsSubscription = null;
    this.queryState.set(INITIAL_SERVICE_REQUEST_QUERY);
    resetReadState(this.pageState, null);
    resetReadState(this.equipmentState, null);
    resetReadState(this.techniciansState, []);
    resetReadState(this.selectedState, null);
    resetReadState(this.reviewState, null);
    resetReadState(this.assignedTechnicianState, null);
    resetReadState(this.candidatesState, []);
    resetReadState(this.interventionsState, []);
    this.interventionsEquipmentIdSignal.set(null);
    this.actionStateSignal.set(null);
    this.serviceReportSignal.set(null);
    this.createdRequestSignal.set(null);
    this.creatingSignal.set(false);
    this.createFailureSignal.set(null);
  }
}

/** Brings a listed request up to date with the request as the backend last answered it. */
function withRequest(
  summary: ServiceRequestSummary,
  request: ServiceRequest,
): ServiceRequestSummary {
  return {
    ...summary,
    technicianId: request.technician_id,
    status: request.status,
    equipmentName: request.equipment_name ?? summary.equipmentName,
    siteName: request.site_name ?? summary.siteName,
    technicianName: request.technician_name,
    hasIntervention: request.intervention !== null,
  };
}
