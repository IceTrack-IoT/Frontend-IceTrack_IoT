import { HttpErrorResponse } from '@angular/common/http';
import { catchError, type MonoTypeOperatorFunction, throwError } from 'rxjs';
import { isErrorResource } from '@shared/infrastructure/api/error.response';
import { isProfilesErrorCode, ProfilesError } from '@profiles/application/contracts/profiles-error';

/**
 * Maps a definitive backend rejection (any 4xx answer) to ProfilesError, keeping only the
 * machine-readable `code` of the error body; the code is null when it is not a confirmed Profiles code.
 * Backend messages and details are never carried over. Any other error (network failure, server error) is
 * returned unchanged as transient.
 * @param error - The error of a Profiles request.
 * @returns The ProfilesError, or the original error.
 */
export function toProfilesError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse) || error.status < 400 || error.status >= 500) {
    return error;
  }
  const body: unknown = error.error;
  const code = isErrorResource(body) ? body.code : null;
  return new ProfilesError(
    isProfilesErrorCode(code) ? code : null,
    `The backend rejected the Profiles request (HTTP ${error.status}).`,
  );
}

/**
 * RxJS operator that rethrows the errors of a Profiles request mapped by `toProfilesError`.
 * @returns The operator.
 */
export function mapProfilesErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toProfilesError(error)));
}
