import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { User } from '@iam/domain/model/user.entity';
import type { TechnicianSignUp } from '@iam/application/contracts/local-sign-up';
import { AuthenticationPort } from '@iam/application/ports/authentication.port';

/**
 * Registers a local technician account. Registration does not start a session.
 */
@Injectable({
  providedIn: 'root',
})
export class SignUpTechnicianUseCase {
  private readonly authentication = inject(AuthenticationPort);

  /**
   * @param signUp - The technician registration data.
   * @returns An Observable of the registered user.
   */
  execute(signUp: TechnicianSignUp): Observable<User> {
    return this.authentication.signUpTechnician(signUp);
  }
}
