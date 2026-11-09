/** The longest dismissal reason the backend accepts. */
export const DISMISS_REASON_MAX_LENGTH = 500;
/** The longest dismissal evidence the backend accepts. */
export const DISMISS_EVIDENCE_MAX_LENGTH = 1000;

/**
 * Why the owner dismisses an alert as a false alarm, such as a planned defrost cycle.
 */
export interface AlertDismissal {
  /** Why the alert does not represent an actual fault; not blank, up to 500 characters. */
  readonly reason: string;
  /** Optional supporting evidence, up to 1000 characters; null when none is given. */
  readonly evidence: string | null;
}
