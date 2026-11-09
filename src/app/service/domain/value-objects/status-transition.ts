import { ServiceStatus } from '@service/domain/value-objects/service-status';

/**
 * One entry of the status history of a service request. The first entry is the creation, without a
 * previous status.
 */
export interface StatusTransition {
  /** The status before the transition; null for the creation. */
  readonly from_status: ServiceStatus | null;
  readonly to_status: ServiceStatus;
  /** The profile identifier of the owner or technician who acted. */
  readonly actor_id: number;
  readonly occurred_at: Date;
  /** Why it happened, for a rejection or a cancellation; null otherwise. */
  readonly reason: string | null;
  /** The technician the transition concerns, if any. */
  readonly technician_id: number | null;
}

/**
 * The lifecycle actions a status transition records, following the documented state machine.
 */
export type TransitionKind =
  | 'CREATED'
  | 'ASSIGNED'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELED';

/**
 * Resolves the lifecycle action a status transition records. Assignment and rejection both lead to
 * PENDING; only a rejection carries a reason.
 * @param transition - The status transition.
 * @returns The lifecycle action of the transition.
 */
export function transitionKindOf(transition: StatusTransition): TransitionKind {
  switch (transition.to_status) {
    case ServiceStatus.PENDING:
      if (transition.from_status === null) {
        return 'CREATED';
      }
      return transition.reason === null ? 'ASSIGNED' : 'REJECTED';
    case ServiceStatus.ACCEPTED:
      return 'ACCEPTED';
    case ServiceStatus.IN_PROGRESS:
      return 'STARTED';
    case ServiceStatus.COMPLETED:
      return 'COMPLETED';
    case ServiceStatus.CANCELED:
      return 'CANCELED';
  }
}

/**
 * Checks whether a lifecycle action is performed by the assigned technician; the owner performs the
 * others.
 * @param kind - The lifecycle action.
 * @returns True when the technician performs it.
 */
export function isTechnicianTransition(kind: TransitionKind): boolean {
  return kind === 'REJECTED' || kind === 'ACCEPTED' || kind === 'STARTED' || kind === 'COMPLETED';
}
