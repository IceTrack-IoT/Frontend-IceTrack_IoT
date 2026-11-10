import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { OwnerStreamSignal } from '@monitoring/application/contracts/owner-stream-signal';
import { RelayOwnerStreamEventUseCase } from '@monitoring/application/use-cases/relay-owner-stream-event.use-case';
import type { OwnerStreamSourcePort as DeviceOwnerStreamSourcePort } from '@device/application/ports/owner-stream-source.port';
import type { OwnerStreamSourcePort as NotificationsOwnerStreamSourcePort } from '@notifications/application/ports/owner-stream-source.port';
import type { OwnerStreamSourcePort as ReportingOwnerStreamSourcePort } from '@reporting/application/ports/owner-stream-source.port';

/**
 * OwnerStreamFacade implements the owner stream source ports of Device Management, Notifications and
 * Reporting with the owner event stream that Monitoring and Alerting holds. It only forwards the named
 * event each context asks for, on the shared connection; parsing the payload and deciding what to do with
 * it, or with a gap, belong to the consuming context.
 */
@Injectable({
  providedIn: 'root',
})
export class OwnerStreamFacade
  implements
    DeviceOwnerStreamSourcePort,
    NotificationsOwnerStreamSourcePort,
    ReportingOwnerStreamSourcePort
{
  private readonly relayOwnerStreamEventUseCase = inject(RelayOwnerStreamEventUseCase);

  watch(eventName: string): Observable<OwnerStreamSignal> {
    return this.relayOwnerStreamEventUseCase.execute(eventName);
  }
}
