/**
 * GoogleRegistrationProfile contains the onboarding data a Google user provides to complete the
 * registration. The username and email come from the Google account.
 */
export interface GoogleRegistrationProfile {
  readonly username: string;
  readonly phone: string;
  readonly street: string;
  readonly number: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
}

/**
 * GoogleOwnerRegistration completes the registration of a Google user as an owner.
 */
export interface GoogleOwnerRegistration extends GoogleRegistrationProfile {
  readonly ruc: number;
}
