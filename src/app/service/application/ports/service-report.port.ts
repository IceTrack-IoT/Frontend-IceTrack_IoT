import type { Observable } from 'rxjs';

/**
 * ServiceReportPort is the outbound port Service Request Management uses to request the downloadable
 * document of a completed service request. Reporting owns report generation and implements it; the report
 * is then followed and downloaded in Reporting, by its identifier.
 *
 * Any failure is reported as an error the caller does not interpret: the document can be requested again.
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ServiceReportPort {
  /**
   * Requests the PDF document of one of the owner's completed service requests.
   * @param serviceRequestId - The identifier of the completed service request.
   * @param name - The display name of the document, up to 150 characters.
   * @returns An Observable of the identifier of the accepted report.
   */
  abstract requestServiceReport(serviceRequestId: number, name: string): Observable<number>;
}
