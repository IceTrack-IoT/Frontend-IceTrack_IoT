import type { ClientSession } from '@iam/application/state/client-session';

/**
 * SessionStoragePort is the outbound port used by IAM use cases to persist the client session.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class SessionStoragePort {
  /**
   * Loads the persisted client session.
   * @returns The persisted client session, or null when none is available or it is invalid.
   */
  abstract load(): ClientSession | null;

  /**
   * Persists the client session, replacing any previous one.
   * @param session - The client session to persist.
   */
  abstract save(session: ClientSession): void;

  /**
   * Removes the persisted client session.
   */
  abstract clear(): void;
}
