import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Intervention } from '@service/domain/model/intervention.entity';
import { ServiceRequestsPort } from '@service/application/ports/service-requests.port';

/**
 * Loads the intervention history of one of the owner's equipment items. Owners only read interventions;
 * technicians register them from the mobile application.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadEquipmentInterventionsUseCase {
  private readonly serviceRequests = inject(ServiceRequestsPort);

  /**
   * @param equipmentId - The identifier of the equipment.
   * @returns An Observable of the interventions, most recent first.
   */
  execute(equipmentId: number): Observable<Intervention[]> {
    return this.serviceRequests.getEquipmentInterventions(equipmentId);
  }
}
