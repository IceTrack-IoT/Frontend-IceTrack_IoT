/**
 * Session state events exchanged between browser tabs. They never carry token values: receivers
 * re-read the canonical persisted session instead.
 */
export const SESSION_SYNC_EVENTS = [
  'refresh-started',
  'refresh-completed',
  'signed-in',
  'session-cleared',
  'logout-completed',
] as const;

export type SessionSyncEvent = (typeof SESSION_SYNC_EVENTS)[number];

/**
 * Checks whether a value received from another tab is a SessionSyncEvent.
 * @param value - The value to check.
 * @returns True when the value is a SessionSyncEvent.
 */
export function isSessionSyncEvent(value: unknown): value is SessionSyncEvent {
  return SESSION_SYNC_EVENTS.some((event) => event === value);
}
