import {
  type HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  type HttpParams,
} from '@angular/common/http';
import { catchError, map, type Observable, of, throwError } from 'rxjs';

/** HTTP status answered when the resource did not change since the ETag sent in `If-None-Match`. */
const NOT_MODIFIED = 304;

/**
 * ConditionalRead sends `GET` requests that revalidate the last answer of the same URL and query: the ETag
 * the backend returned is sent back in `If-None-Match`, and a `304 Not Modified` answer (empty body) is
 * resolved with the body kept from that read.
 *
 * The ETag is a digest of the body, so the kept body is exactly what a full read would return. Answers
 * without an ETag are not kept. Every other error is rethrown unchanged.
 */
export class ConditionalRead<T> {
  private readonly answers = new Map<string, { readonly etag: string; readonly body: T }>();

  constructor(private readonly http: HttpClient) {}

  /**
   * Reads a resource, revalidating the last answer of the same URL and query.
   * @param url - The absolute URL of the resource.
   * @param params - The query parameters.
   * @returns An Observable of the body.
   */
  get(url: string, params: HttpParams): Observable<T> {
    const query = params.toString();
    const key = query === '' ? url : `${url}?${query}`;
    const kept = this.answers.get(key);
    const headers =
      kept === undefined ? undefined : new HttpHeaders({ 'If-None-Match': kept.etag });
    return this.http.get<T>(url, { params, headers, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (body === null) {
          throw new Error('The conditional read answered without a body.');
        }
        const etag = response.headers.get('ETag');
        if (etag === null) {
          this.answers.delete(key);
        } else {
          this.answers.set(key, { etag, body });
        }
        return body;
      }),
      catchError((error: unknown) =>
        kept !== undefined && error instanceof HttpErrorResponse && error.status === NOT_MODIFIED
          ? of(kept.body)
          : throwError(() => error),
      ),
    );
  }
}
