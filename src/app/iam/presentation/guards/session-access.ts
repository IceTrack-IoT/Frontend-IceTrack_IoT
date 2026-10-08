import { inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { IamStore } from '@iam/application/iam-store';
import type { User } from '@iam/domain/model/user.entity';

/**
 * Decides a navigation once the startup session restoration has completed, from the authenticated user
 * (null when there is no session). Must be called in an injection context, such as a guard.
 * @param decide - The navigation decision for the authenticated user.
 * @returns An Observable of the decision.
 */
export function afterSessionResolved<T>(decide: (user: User | null) => T): Observable<T> {
  const iamStore = inject(IamStore);
  return iamStore.whenSessionResolved().pipe(map(() => decide(iamStore.currentUser())));
}
