import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, type Subscription, switchMap } from 'rxjs';
import { environment } from '@env/environment';
import { MonitoringError } from '@monitoring/application/contracts/monitoring-error';
import type { MonitoringUpdate } from '@monitoring/application/contracts/monitoring-update';
import type { MonitoringStreamPort } from '@monitoring/application/ports/monitoring-stream.port';
import { MonitoringApiEndpoint } from '@monitoring/infrastructure/api/monitoring-api-endpoint';
import { mapMonitoringErrors } from '@monitoring/infrastructure/api/monitoring-error-mapping';
import { TelemetryStreamAssembler } from '@monitoring/infrastructure/streaming/telemetry-stream-assembler';

/** The SSE event sent first on every connection, with the server timeout of the stream. */
const STREAM_OPENED_EVENT = 'stream-opened';
/** The SSE event carrying a reading or an alert status change. */
const TELEMETRY_UPDATE_EVENT = 'telemetry-update';

/** How long before the server closes the stream (30 minutes) a fresh one is opened. */
const RENEW_BEFORE_TIMEOUT_SECONDS = 30;
const FIRST_RETRY_DELAY_MS = 2_000;
const MAX_RETRY_DELAY_MS = 60_000;
/** The `Retry-After` of a ticket refused because too many are pending. */
const TOO_MANY_TICKETS_DELAY_MS = 60_000;

/** The stream is about to reach its server timeout and is renewed with a new ticket. */
class StreamRenewal extends Error {
  override name = 'StreamRenewal';
}

/**
 * MonitoringStreamApi implements the MonitoringStreamPort with the telemetry Server-Sent Events stream.
 *
 * A browser `EventSource` cannot send the bearer token, so each connection first trades it for a
 * single-use ticket (`POST /telemetry/stream-ticket`) and then opens `GET /telemetry/stream?ticket=`. A
 * spent ticket cannot reconnect, so the automatic `EventSource` retry is never relied on: on any error the
 * source is closed and a new ticket is requested after an increasing delay, and the stream is renewed just
 * before its 30-minute server timeout. It gives up only when the session may not open it at all.
 */
@Injectable({
  providedIn: 'root',
})
export class MonitoringStreamApi implements MonitoringStreamPort {
  private readonly endpoint = new MonitoringApiEndpoint(inject(HttpClient));
  private readonly assembler = new TelemetryStreamAssembler();
  private readonly streamUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderTelemetryStreamEndpointPath}`;

  watch(): Observable<MonitoringUpdate> {
    return new Observable<MonitoringUpdate>((subscriber) => {
      let failures = 0;
      let connection: Subscription | null = null;
      let retry: ReturnType<typeof setTimeout> | null = null;

      const connect = (): void => {
        retry = null;
        connection = this.endpoint
          .issueStreamTicket()
          .pipe(
            mapMonitoringErrors(),
            switchMap(({ ticket }) => this.open(ticket)),
          )
          .subscribe({
            next: (update) => {
              if (update.kind === 'connected') {
                failures = 0;
              }
              subscriber.next(update);
            },
            error: (error: unknown) => {
              if (isPermanent(error)) {
                subscriber.error(error);
                return;
              }
              if (error instanceof StreamRenewal) {
                connect();
                return;
              }
              subscriber.next({ kind: 'disconnected' });
              retry = setTimeout(connect, retryDelay(error, failures++));
            },
          });
      };

      connect();
      return () => {
        connection?.unsubscribe();
        if (retry !== null) {
          clearTimeout(retry);
        }
      };
    });
  }

  /** Opens one stream connection with a ticket; it errors when the connection drops or must be renewed. */
  private open(ticket: string): Observable<MonitoringUpdate> {
    return new Observable<MonitoringUpdate>((subscriber) => {
      if (typeof EventSource === 'undefined') {
        subscriber.error(new MonitoringError(null, 'Server-Sent Events are not supported.'));
        return undefined;
      }
      const source = new EventSource(`${this.streamUrl}?ticket=${encodeURIComponent(ticket)}`);
      let renewal: ReturnType<typeof setTimeout> | null = null;

      source.addEventListener(STREAM_OPENED_EVENT, (event) => {
        subscriber.next({ kind: 'connected' });
        const timeout = this.assembler.toStreamTimeoutSeconds(readData(event));
        if (timeout !== null && renewal === null) {
          const delay = Math.max(0, timeout - RENEW_BEFORE_TIMEOUT_SECONDS) * 1000;
          renewal = setTimeout(() => subscriber.error(new StreamRenewal()), delay);
        }
      });
      source.addEventListener(TELEMETRY_UPDATE_EVENT, (event) => {
        const update = this.assembler.toMonitoringUpdate(readData(event));
        if (update !== null) {
          subscriber.next(update);
        }
      });
      // A dropped connection, the server timeout and a refused ticket all end here.
      source.addEventListener('error', () =>
        subscriber.error(new Error('The telemetry stream was interrupted.')),
      );

      return () => {
        if (renewal !== null) {
          clearTimeout(renewal);
        }
        source.close();
      };
    });
  }
}

/** Whether the stream can never be opened for this session: the caller is not an owner, has no session, or the browser has no EventSource. */
function isPermanent(error: unknown): boolean {
  return (
    error instanceof MonitoringError &&
    (error.code === null || error.code === 'ACCESS_DENIED' || error.code === 'UNAUTHORIZED')
  );
}

function retryDelay(error: unknown, failures: number): number {
  if (error instanceof MonitoringError && error.code === 'TOO_MANY_REQUESTS') {
    return TOO_MANY_TICKETS_DELAY_MS;
  }
  return Math.min(FIRST_RETRY_DELAY_MS * 2 ** failures, MAX_RETRY_DELAY_MS);
}

/** Parses the JSON data of an SSE message, or returns null when it is not JSON. */
function readData(event: Event): unknown {
  if (!(event instanceof MessageEvent) || typeof event.data !== 'string') {
    return null;
  }
  try {
    const data: unknown = JSON.parse(event.data);
    return data;
  } catch {
    return null;
  }
}
