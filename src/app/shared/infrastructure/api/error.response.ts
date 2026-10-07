/**
 * ErrorResource is the standard body of backend business errors.
 */
export interface ErrorResource {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Validates that an untrusted error body carries the machine-readable ErrorResource `code`.
 * Human-readable fields are never used to identify errors, so they are not required here.
 * @param body - The parsed error body.
 * @returns True when the body has a string `code`.
 */
export function isErrorResource(body: unknown): body is Pick<ErrorResource, 'code'> {
  return (
    typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string'
  );
}

/**
 * Reads the human-readable ErrorResource `message` of an untrusted error body, for display only.
 * @param body - The parsed error body.
 * @returns The message, or null when the body has none.
 */
export function readErrorMessage(body: unknown): string | null {
  return typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
    ? body.message
    : null;
}
