import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { defer, type Observable, retry, throwError, timer } from 'rxjs';

/** Wait before the single retry of a creating request whose outcome is unknown. */
const IDEMPOTENT_RETRY_DELAY_MS = 1000;

/**
 * Builds the `If-Match` header of an update, so the backend refuses it with
 * `409 CONCURRENT_MODIFICATION_CONFLICT` when the resource changed since the version that was read.
 * @param version - The concurrency `version` of the resource as it was read.
 * @returns The request headers.
 */
export function ifMatchHeaders(version: number): HttpHeaders {
  return new HttpHeaders({ 'If-Match': `"${version}"` });
}

/**
 * Sends a creating request with an `Idempotency-Key`, generated once for this submission. When the outcome
 * is unknown (a network failure or a server error), the request is sent once more with the same key, so
 * the backend answers the stored result again instead of creating a duplicate. Definitive rejections
 * (any 4xx answer) are never retried.
 * @param send - Sends the request with the given headers; it is called once per attempt.
 * @returns An Observable of the answer of the request.
 */
export function sendIdempotent<T>(send: (headers: HttpHeaders) => Observable<T>): Observable<T> {
  return defer(() => {
    const headers = new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
    return send(headers).pipe(
      retry({
        count: 1,
        delay: (error: unknown) =>
          isUnknownOutcome(error) ? timer(IDEMPOTENT_RETRY_DELAY_MS) : throwError(() => error),
      }),
    );
  });
}

/**
 * Checks whether a request failed without a definitive answer: no response at all, or a server error.
 */
function isUnknownOutcome(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}
