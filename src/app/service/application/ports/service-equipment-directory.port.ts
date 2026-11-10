import type { Observable } from 'rxjs';
import type { ServiceEquipmentDirectory } from '@service/application/contracts/service-equipment';

/**
 * ServiceEquipmentDirectoryPort gives Service Request Management the read-only identity of the owner's
 * equipment (id, name, site) and sites (id, name) that service requests refer to. Assets Management owns
 * that data and implements this port with an application facade; it exposes no equipment or site
 * registration, editing or ownership behavior. The backend scopes the directory to the signed-in owner.
 *
 * Declared as an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class ServiceEquipmentDirectoryPort {
  /**
   * Lists every equipment item and site of the signed-in owner.
   * @returns An Observable of the directory.
   */
  abstract loadDirectory(): Observable<ServiceEquipmentDirectory>;
}
