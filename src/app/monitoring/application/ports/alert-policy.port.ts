import type { Observable } from 'rxjs';
import type { AlertPolicy } from '@monitoring/domain/model/alert-policy.entity';

/**
 * AlertPolicyPort is the outbound port used by Monitoring and Alerting use cases to read the alert policy
 * that applies to an equipment item.
 *
 * Definitive backend rejections are reported as MonitoringError; any other error is transient. Declared as
 * an abstract class so it can be used as an Angular dependency injection token.
 */
export abstract class AlertPolicyPort {
  /**
   * Retrieves the policy of an equipment item: its own policy when one is active, otherwise the
   * platform-wide default.
   * Fails with `NOT_FOUND` when the equipment is not reachable by the owner.
   * @param equipmentId - The identifier of the equipment.
   * @returns An Observable of the applicable policy.
   */
  abstract getApplicablePolicy(equipmentId: number): Observable<AlertPolicy>;
}
