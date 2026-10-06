import { isRole, type Role } from '@iam/domain/value-objects/role';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';

/**
 * Version of the persisted ClientSessionResource format.
 */
export const CLIENT_SESSION_RESOURCE_VERSION = 1;

/**
 * ClientSessionUserResource is the minimum authenticated user data persisted with the session.
 */
export interface ClientSessionUserResource {
  readonly id: number;
  readonly username: string;
  readonly role: Role;
  readonly provider: AuthProvider;
}

/**
 * ClientSessionResource is the single canonical representation of the client session persisted in
 * browser storage. It never contains the Google ID token.
 */
export interface ClientSessionResource {
  readonly version: typeof CLIENT_SESSION_RESOURCE_VERSION;
  readonly token: string;
  readonly refresh_token: string;
  /** Access token expiration as epoch milliseconds. */
  readonly token_expires_at: number;
  readonly user: ClientSessionUserResource;
}

/**
 * Validates at runtime that an untrusted value read from browser storage is a ClientSessionResource.
 * @param value The parsed value to validate.
 * @returns True when the value has the ClientSessionResource shape.
 */
export function isClientSessionResource(value: unknown): value is ClientSessionResource {
  if (!isRecord(value) || !isRecord(value['user'])) {
    return false;
  }
  const user = value['user'];
  return (
    value['version'] === CLIENT_SESSION_RESOURCE_VERSION &&
    isNonEmptyString(value['token']) &&
    isNonEmptyString(value['refresh_token']) &&
    typeof value['token_expires_at'] === 'number' &&
    Number.isFinite(value['token_expires_at']) &&
    typeof user['id'] === 'number' &&
    typeof user['username'] === 'string' &&
    isRole(user['role'])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}
