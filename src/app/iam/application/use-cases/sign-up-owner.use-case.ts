import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { User } from '@iam/domain/model/user.entity';
import type { OwnerSignUp } from '@iam/application/contracts/local-sign-up';
import { AuthenticationPort } from '@iam/application/ports/authentication.port';

/**
 * Registers a local owner account. Registration does not start a session.
 */
@Injectable({
  providedIn: 'root',
})
export class SignUpOwnerUseCase {
  private readonly authentication = inject(AuthenticationPort);

  /**
   * @param signUp - The owner registration data.
   * @returns An Observable of the registered user.
   */
  execute(signUp: OwnerSignUp): Observable<User> {
    return this.authentication.signUpOwner(signUp);
  }
}
