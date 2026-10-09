/**
 * AuthErrorResource is the HTTP 401 body of refresh-token failures.
 *
 * Only `code` is machine-readable; the remaining fields are human-readable and intentionally not modeled.
 */
export interface AuthErrorResponse {
  code: string;
}

/**
 * Validates that an untrusted error body is an AuthErrorResource.
 * @param body - The parsed error body.
 * @returns True when the body has a string `code`.
 */
export function isAuthErrorResponse(body: unknown): body is AuthErrorResponse {
  return (
    typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string'
  );
}
