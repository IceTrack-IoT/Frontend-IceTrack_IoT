/**
 * LocalSignUp contains the account and profile data shared by every local registration.
 */
export interface LocalSignUp {
  readonly username: string;
  readonly password: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone: string;
  readonly street: string;
  readonly number: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
}

/**
 * OwnerSignUp is the local registration of an owner. The backend assigns the owner role.
 */
export interface OwnerSignUp extends LocalSignUp {
  readonly ruc: number;
}

/**
 * TechnicianSignUp is the local registration of a technician. The backend assigns the technician role.
 */
export interface TechnicianSignUp extends LocalSignUp {
  readonly speciality: string;
  readonly certificationNumber: string;
}
