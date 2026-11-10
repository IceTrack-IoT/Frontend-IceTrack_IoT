import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  catchError,
  concat,
  defer,
  EMPTY,
  filter,
  map,
  Observable,
  of,
  share,
  type Subscription,
  switchMap,
} from 'rxjs';
import { environment } from '@env/environment';
import { MonitoringError } from '@monitoring/application/contracts/monitoring-error';
import type { MonitoringUpdate } from '@monitoring/application/contracts/monitoring-update';
import type { OwnerStreamSignal } from '@monitoring/application/contracts/owner-stream-signal';
import type { MonitoringStreamPort } from '@monitoring/application/ports/monitoring-stream.port';
import { MonitoringApiEndpoint } from '@monitoring/infrastructure/api/monitoring-api-endpoint';
import { mapMonitoringErrors } from '@monitoring/infrastructure/api/monitoring-error-mapping';
import {
  MONITORING_STREAM_EVENTS,
  TelemetryStreamAssembler,
} from '@monitoring/infrastructure/streaming/telemetry-stream-assembler';

/** The SSE event sent first on every connection, with the server timeout and the replay outcome. */
const STREAM_OPENED_EVENT = 'stream-opened';

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

/** What the shared connection emits: its lifecycle, and every named event listened to, uninterpreted. */
type StreamSignal =
  | { readonly kind: 'connected'; readonly resumed: boolean }
  | { readonly kind: 'disconnected' }
  | { readonly kind: 'message'; readonly event: string; readonly data: unknown };

/**
 * MonitoringStreamApi implements the MonitoringStreamPort with the owner event stream (Server-Sent
 * Events). It owns the transport only: the ticket, the single shared connection, its renewal and
 * reconnection with `last_event_id` replay, and the multiplexing of named events. It interprets the
 * events Monitoring owns (readings, alert status and connectivity changes); any other event is listened to
 * only once a bounded context asks for it by name, and is relayed to it uninterpreted.
 *
 * Every subscriber shares one connection, because the backend closes the oldest stream of an owner beyond
 * ten. A browser `EventSource` cannot send the bearer token, so each connection first trades it for a
 * single-use ticket (`POST /telemetry/stream-ticket`) and then opens `GET /telemetry/stream?ticket=`,
 * passing the id of the last event received as `last_event_id` so the backend replays what was missed. A
 * spent ticket cannot reconnect, so the automatic `EventSource` retry is never relied on: on any error the
 * source is closed and a new ticket is requested after an increasing delay, and the stream is renewed just
 * before its 30-minute server timeout. It gives up only when the session may not open it at all.
 *
 * The last event id and the relayed event names are forgotten when the last subscriber leaves, so a later
 * session never resumes from the events of a previous one.
 */
@Injectable({
  providedIn: 'root',
})
export class MonitoringStreamApi implements MonitoringStreamPort {
  private readonly endpoint = new MonitoringApiEndpoint(inject(HttpClient));
  private readonly assembler = new TelemetryStreamAssembler();
  private readonly streamUrl = `${environment.iceTrackProviderApiBaseUrl}${environment.iceTrackProviderTelemetryStreamEndpointPath}`;

  private lastEventId: string | null = null;
  private connected = false;
  /** Whether the connection dropped and is being reopened. */
  private interrupted = false;
  /** The named events listened to on every connection. */
  private readonly eventNames = new Set<string>(MONITORING_STREAM_EVENTS);
  /** Starts listening to a named event on the open connection, if any. */
  private listenOnOpenSource: ((eventName: string) => void) | null = null;

  private readonly shared: Observable<StreamSignal> = new Observable<StreamSignal>((subscriber) => {
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
          next: (signal) => {
            if (signal.kind === 'connected') {
              failures = 0;
              this.connected = true;
              this.interrupted = false;
            }
            subscriber.next(signal);
          },
          error: (error: unknown) => {
            this.connected = false;
            if (isPermanent(error)) {
              subscriber.error(error);
              return;
            }
            if (error instanceof StreamRenewal) {
              connect();
              return;
            }
            this.interrupted = true;
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
      this.connected = false;
      this.interrupted = false;
      this.lastEventId = null;
      this.eventNames.clear();
      MONITORING_STREAM_EVENTS.forEach((name) => this.eventNames.add(name));
    };
  }).pipe(share());

  watch(): Observable<MonitoringUpdate> {
    // A subscriber joining an open connection learns it is connected; its own state was just read.
    return defer(() =>
      concat(
        this.connected ? of<StreamSignal>({ kind: 'connected', resumed: true }) : EMPTY,
        this.shared,
      ),
    ).pipe(
      map((signal) =>
        signal.kind === 'message'
          ? this.assembler.toMonitoringUpdate(signal.event, signal.data)
          : signal,
      ),
      filter((update): update is MonitoringUpdate => update !== null),
    );
  }

  watchEvent(eventName: string): Observable<OwnerStreamSignal> {
    // A subscriber joining while the connection is down learns it is interrupted.
    return defer(() => {
      this.listenTo(eventName);
      return concat(
        this.interrupted ? of<StreamSignal>({ kind: 'disconnected' }) : EMPTY,
        this.shared,
      );
    }).pipe(
      map((signal): OwnerStreamSignal | null => {
        switch (signal.kind) {
          case 'message':
            return signal.event === eventName ? { kind: 'event', data: signal.data } : null;
          case 'disconnected':
            return { kind: 'interrupted' };
          case 'connected':
            return signal.resumed ? { kind: 'restored' } : { kind: 'gap' };
        }
      }),
      filter((signal): signal is OwnerStreamSignal => signal !== null),
      // A stream that can never be opened ends the relayed feed; the transport error stays here.
      catchError(() => EMPTY),
    );
  }

  /** Listens to a named event on every connection from now on, including the open one. */
  private listenTo(eventName: string): void {
    if (!this.eventNames.has(eventName)) {
      this.eventNames.add(eventName);
      this.listenOnOpenSource?.(eventName);
    }
  }

  /** Opens one stream connection with a ticket; it errors when the connection drops or must be renewed. */
  private open(ticket: string): Observable<StreamSignal> {
    return new Observable<StreamSignal>((subscriber) => {
      if (typeof EventSource === 'undefined') {
        subscriber.error(new MonitoringError(null, 'Server-Sent Events are not supported.'));
        return undefined;
      }
      const resumingFrom = this.lastEventId;
      const query = `ticket=${encodeURIComponent(ticket)}${
        resumingFrom === null ? '' : `&last_event_id=${encodeURIComponent(resumingFrom)}`
      }`;
      const source = new EventSource(`${this.streamUrl}?${query}`);
      let renewal: ReturnType<typeof setTimeout> | null = null;

      source.addEventListener(STREAM_OPENED_EVENT, (event) => {
        const opened = this.assembler.toStreamOpened(readData(event));
        subscriber.next({
          kind: 'connected',
          resumed: resumingFrom !== null && opened.replayComplete,
        });
        if (opened.timeoutSeconds !== null && renewal === null) {
          const delay = Math.max(0, opened.timeoutSeconds - RENEW_BEFORE_TIMEOUT_SECONDS) * 1000;
          renewal = setTimeout(() => subscriber.error(new StreamRenewal()), delay);
        }
      });
      const listening = new Set<string>();
      const listen = (eventName: string): void => {
        if (listening.has(eventName)) {
          return;
        }
        listening.add(eventName);
        source.addEventListener(eventName, (event) => {
          if (event instanceof MessageEvent && event.lastEventId !== '') {
            this.lastEventId = event.lastEventId;
          }
          subscriber.next({ kind: 'message', event: eventName, data: readData(event) });
        });
      };
      this.eventNames.forEach(listen);
      this.listenOnOpenSource = listen;
      // A dropped connection, the server timeout and a refused ticket all end here.
      source.addEventListener('error', () =>
        subscriber.error(new Error('The owner event stream was interrupted.')),
      );

      return () => {
        if (this.listenOnOpenSource === listen) {
          this.listenOnOpenSource = null;
        }
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
