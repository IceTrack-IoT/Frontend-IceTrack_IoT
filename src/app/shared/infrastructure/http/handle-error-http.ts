import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

/**
 * Handles HTTP errors by returning an Observable that throws a descriptive error message.
 *
 * @param operation - The name of the operation that failed, used to create a descriptive error message.
 * @returns A function that takes an HttpErrorResponse and returns an Observable that throws an Error with a descriptive message.
 */
export function handleError(operation: string) {
  return (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = operation;
    if (error.status === 404) {
      errorMessage = `${operation}: Resource not found`;
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `${operation}: ${error.error.message}`;
    } else {
      errorMessage = `${operation}: ${error.error || 'Unexpected error'}`;
    }
    return throwError(() => new Error(errorMessage));
  };
}
