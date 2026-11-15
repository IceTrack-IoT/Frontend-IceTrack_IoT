import { inject, Injectable } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import type { ServiceRequest } from '@service/domain/model/service-request.entity';
import { ServiceRequestsError } from '@service/application/contracts/service-requests-error';
import { ServiceReportPort } from '@service/application/ports/service-report.port';

/**
 * Requests the downloadable document of a completed service request (its status history, intervention
 * and review) through Reporting, which generates it in the background and serves its file. Only a
 * completed request is documented; the backend remains the authority.
 */
@Injectable({
  providedIn: 'root',
})
export class GenerateServiceReportUseCase {
  private readonly serviceReports = inject(ServiceReportPort);

  /**
   * @param request - The completed service request.
   * @param name - The display name of the document.
   * @returns An Observable of the identifier of the report that documents the request.
   */
  execute(request: ServiceRequest, name: string): Observable<number> {
    if (!request.canBeReviewed()) {
      return throwError(
        () =>
          new ServiceRequestsError(
            'INVALID_STATUS_TRANSITION',
            'Only a completed service request can be documented.',
          ),
      );
    }
    return this.serviceReports.requestServiceReport(request.id, name);
  }
}
