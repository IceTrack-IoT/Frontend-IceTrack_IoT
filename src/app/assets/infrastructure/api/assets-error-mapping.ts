import { HttpErrorResponse } from '@angular/common/http';
import { catchError, type MonoTypeOperatorFunction, throwError } from 'rxjs';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import { AssetsError, isAssetsErrorCode } from '@assets/application/contracts/assets-error';

/** The most candidate addresses the backend offers for an unverified address. */
const MAX_CANDIDATES = 5;

/**
 * Maps a definitive backend rejection (any 4xx answer, or `503 GEOCODING_UNAVAILABLE`) to AssetsError,
 * keeping only the machine-readable `code` of the error body and, for `ADDRESS_NOT_VERIFIED`, its candidate
 * addresses. Every `404` becomes `NOT_FOUND`, because "does not exist" and "is not yours" must not be
 * distinguished. Backend messages and details are never carried over. Any other error (network failure,
 * server error) is returned unchanged as transient.
 * @param error - The error of an Assets Management request.
 * @returns The AssetsError, or the original error.
 */
export function toAssetsError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse)) {
    return error;
  }
  const body: unknown = error.error;
  const bodyCode = isErrorResource(body) ? body.code : null;
  const definitive =
    (error.status >= 400 && error.status < 500) ||
    (error.status === 503 && bodyCode === 'GEOCODING_UNAVAILABLE');
  if (!definitive) {
    return error;
  }
  const code = error.status === 404 ? 'NOT_FOUND' : bodyCode;
  return new AssetsError(
    isAssetsErrorCode(code) ? code : null,
    `The backend rejected the assets operation (HTTP ${error.status}).`,
    code === 'ADDRESS_NOT_VERIFIED' ? readCandidates(body) : [],
  );
}

/**
 * RxJS operator that rethrows the errors of an Assets Management request mapped by `toAssetsError`.
 * @returns The operator.
 */
export function mapAssetsErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toAssetsError(error)));
}

/** Reads the candidate addresses of an untrusted `ADDRESS_NOT_VERIFIED` body. */
function readCandidates(body: unknown): string[] {
  if (typeof body !== 'object' || body === null || !('candidates' in body)) {
    return [];
  }
  const candidates: unknown = body.candidates;
  return Array.isArray(candidates)
    ? candidates
        .filter((candidate): candidate is string => typeof candidate === 'string')
        .slice(0, MAX_CANDIDATES)
    : [];
}
