import type { AlertAction } from '@monitoring/application/monitoring-store';
import type { MonitoringFailure } from '@monitoring/application/contracts/monitoring-error';

/**
 * Translation keys of the feedback shown for Monitoring and Alerting operations. Backend messages are
 * never shown.
 */

/** The confirmation announced when an alert action succeeds. */
export const ALERT_ACTION_SUCCESS_KEYS: Readonly<Record<AlertAction, string>> = {
  acknowledge: 'monitoring.actions.acknowledged',
  resolve: 'monitoring.actions.resolved',
  dismiss: 'monitoring.actions.dismissed',
};

/**
 * Resolves the translation key shown when an alert action fails.
 * @param failure - Why it failed.
 * @returns The translation key.
 */
export function alertActionErrorKey(failure: MonitoringFailure | null): string {
  switch (failure) {
    case 'INVALID_STATUS_TRANSITION':
    case 'CONCURRENT_MODIFICATION_CONFLICT':
      return 'monitoring.errors.alertChanged';
    case 'NOT_FOUND':
      return 'monitoring.errors.alertNotFound';
    case 'VALIDATION_ERROR':
      return 'monitoring.errors.invalidDismissal';
    case 'ACCESS_DENIED':
      return 'monitoring.errors.accessDenied';
    default:
      return 'monitoring.errors.unexpected';
  }
}

/** The translation key describing each state of the live feed. */
export const LIVE_STATUS_KEYS = {
  idle: 'monitoring.live.connecting',
  connecting: 'monitoring.live.connecting',
  live: 'monitoring.live.live',
  reconnecting: 'monitoring.live.reconnecting',
  unavailable: 'monitoring.live.unavailable',
} as const;
