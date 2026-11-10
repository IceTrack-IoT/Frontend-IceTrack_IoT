import { Intervention } from '@service/domain/model/intervention.entity';
import { Review } from '@service/domain/model/review.entity';
import { ServiceRequest } from '@service/domain/model/service-request.entity';
import type { MaintenanceWindowLink } from '@service/domain/value-objects/maintenance-window-link';
import { isServicePriority } from '@service/domain/value-objects/service-priority';
import { isServiceStatus, type ServiceStatus } from '@service/domain/value-objects/service-status';
import { isServiceType } from '@service/domain/value-objects/service-type';
import type { StatusTransition } from '@service/domain/value-objects/status-transition';
import type { NewServiceRequest } from '@service/application/contracts/new-service-request';
import type { ReviewScores } from '@service/application/contracts/review-scores';
import type {
  ServiceRequestPage,
  ServiceRequestSummary,
} from '@service/application/contracts/service-request-page';
import type { ReviewResource } from '@service/infrastructure/api/review.response';
import type {
  CreateServiceRequestRequest,
  UpdateReviewRequest,
} from '@service/infrastructure/api/service-request.requests';
import type {
  InterventionResource,
  MaintenanceWindowLinkResource,
  PagedServiceRequestSummaryResource,
  ServiceRequestResource,
  ServiceRequestSummaryResource,
  StatusTransitionResource,
} from '@service/infrastructure/api/service-request.response';

/**
 * ServiceRequestAssembler converts the Service Request Management resources into domain entities and
 * application contracts, and application input into request bodies.
 *
 * A resource carrying a value outside the documented enumerations or an unreadable instant is rejected
 * with an error instead of being shown wrongly.
 */
export class ServiceRequestAssembler {
  /**
   * Converts a ServiceRequestResource to a ServiceRequest entity.
   * @param resource - The resource to convert.
   * @returns The corresponding ServiceRequest entity.
   */
  toEntityFromResource(resource: ServiceRequestResource): ServiceRequest {
    const { type, priority } = resource;
    if (!isServiceType(type) || !isServicePriority(priority)) {
      throw new Error('The service request has an unknown type or priority.');
    }
    return new ServiceRequest({
      id: resource.id,
      owner_id: resource.owner_id,
      equipment_id: resource.equipment_id,
      site_id: resource.site_id,
      technician_id: resource.technician_id ?? null,
      type,
      priority,
      description: resource.description,
      status: toStatus(resource.status),
      created_at: toInstant(resource.created_at),
      assigned_at: toOptionalInstant(resource.assigned_at),
      started_at: toOptionalInstant(resource.started_at),
      completed_at: toOptionalInstant(resource.completed_at),
      canceled_at: toOptionalInstant(resource.canceled_at),
      cancel_reason: resource.cancel_reason ?? null,
      history: (resource.history ?? []).map((transition) => toTransition(transition)),
      intervention: resource.intervention
        ? this.toInterventionFromResource(resource.intervention)
        : null,
      maintenance_windows: (resource.maintenance_windows ?? []).map((window) =>
        toMaintenanceWindow(window),
      ),
      equipment_name: resource.equipment_name ?? null,
      site_name: resource.site_name ?? null,
      technician_name: resource.technician_name ?? null,
      source_alert_id: resource.source_alert_id ?? null,
    });
  }

  /**
   * Converts a ServiceRequestSummaryResource to a ServiceRequestSummary.
   * @param resource - The resource to convert.
   * @returns The corresponding summary.
   */
  toSummaryFromResource(resource: ServiceRequestSummaryResource): ServiceRequestSummary {
    const { type, priority } = resource;
    if (!isServiceType(type) || !isServicePriority(priority)) {
      throw new Error('The service request has an unknown type or priority.');
    }
    return {
      id: resource.id,
      equipmentId: resource.equipment_id,
      siteId: resource.site_id,
      technicianId: resource.technician_id ?? null,
      type,
      priority,
      status: toStatus(resource.status),
      createdAt: toInstant(resource.created_at),
      equipmentName: resource.equipment_name ?? null,
      siteName: resource.site_name ?? null,
      technicianName: resource.technician_name ?? null,
      hasIntervention: resource.has_intervention,
      hasReview: resource.has_review,
      sourceAlertId: resource.source_alert_id ?? null,
    };
  }

  /**
   * Converts a PagedServiceRequestSummaryResource to a ServiceRequestPage.
   * @param resource - The resource to convert.
   * @returns The corresponding page.
   */
  toPageFromResource(resource: PagedServiceRequestSummaryResource): ServiceRequestPage {
    return {
      items: (resource.content ?? []).map((item) => this.toSummaryFromResource(item)),
      page: resource.page,
      size: resource.size,
      totalElements: resource.total_elements,
      totalPages: resource.total_pages,
    };
  }

  /**
   * Converts an InterventionResource to an Intervention entity.
   * @param resource - The resource to convert.
   * @returns The corresponding Intervention entity.
   */
  toInterventionFromResource(resource: InterventionResource): Intervention {
    return new Intervention({
      service_request_id: resource.service_request_id,
      client_generated_id: resource.client_generated_id,
      technician_id: resource.technician_id,
      equipment_id: resource.equipment_id,
      diagnosis: resource.diagnosis,
      actions_taken: resource.actions_taken,
      spare_parts: resource.spare_parts ?? [],
      photo_evidence: resource.photo_evidence ?? [],
      started_at: toOptionalInstant(resource.started_at),
      completed_at: toOptionalInstant(resource.completed_at),
      duration_seconds: resource.duration_seconds ?? null,
    });
  }

  /**
   * Converts a ReviewResource to a Review entity.
   * @param resource - The resource to convert.
   * @returns The corresponding Review entity.
   */
  toReviewFromResource(resource: ReviewResource): Review {
    return new Review({
      id: resource.id,
      service_request_id: resource.service_request_id,
      owner_id: resource.owner_id,
      technician_id: resource.technician_id,
      rating: {
        communication: resource.communication,
        efficacy: resource.efficacy,
        performance: resource.performance,
      },
      average_rating: resource.average_rating,
      comment: resource.comment ?? null,
      created_at: toInstant(resource.created_at),
      editable_until: toInstant(resource.editable_until),
    });
  }

  /**
   * Converts the data of a new request to a CreateServiceRequestRequest.
   * @param request - The data of the new request.
   * @returns The request body.
   */
  toCreateRequest(request: NewServiceRequest): CreateServiceRequestRequest {
    return {
      equipment_id: request.equipmentId,
      type: request.type,
      priority: request.priority,
      description: request.description,
      source_alert_id: request.sourceAlertId,
    };
  }

  /**
   * Converts review scores to the scores and comment of a review request body.
   * @param scores - The scores and optional comment.
   * @returns The request body.
   */
  toReviewRequest(scores: ReviewScores): UpdateReviewRequest {
    return {
      communication: scores.rating.communication,
      efficacy: scores.rating.efficacy,
      performance: scores.rating.performance,
      comment: scores.comment,
    };
  }
}

function toStatus(value: unknown): ServiceStatus {
  if (!isServiceStatus(value)) {
    throw new Error('The service request has an unknown status.');
  }
  return value;
}

function toTransition(resource: StatusTransitionResource): StatusTransition {
  return {
    from_status: resource.from_status === null ? null : toStatus(resource.from_status),
    to_status: toStatus(resource.to_status),
    actor_id: resource.actor_id,
    occurred_at: toInstant(resource.occurred_at),
    reason: resource.reason ?? null,
    technician_id: resource.technician_id ?? null,
  };
}

function toMaintenanceWindow(resource: MaintenanceWindowLinkResource): MaintenanceWindowLink {
  return {
    window_id: resource.window_id,
    origin: resource.origin,
    technician_id: resource.technician_id ?? null,
    started_at: toInstant(resource.started_at),
    ended_at: toOptionalInstant(resource.ended_at),
    closure_reason: resource.closure_reason ?? null,
  };
}

/** Parses an ISO 8601 UTC instant, with fractional seconds of any length. */
function toInstant(value: string): Date {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    throw new Error('The service request resource has an unreadable instant.');
  }
  return instant;
}

function toOptionalInstant(value: string | null | undefined): Date | null {
  return value === null || value === undefined ? null : toInstant(value);
}
