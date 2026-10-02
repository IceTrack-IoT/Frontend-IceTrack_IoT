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
