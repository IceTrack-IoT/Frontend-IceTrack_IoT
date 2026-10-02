/**
 * AuthProvider enum represents the different authentication providers that can be used in the application.
 */
export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

/**
 * Checks whether a value is one of the confirmed authentication providers.
 * @param value - The value to check.
 * @returns True when the value is an AuthProvider.
 */
export function isAuthProvider(value: unknown): value is AuthProvider {
  return Object.values(AuthProvider).some((provider) => provider === value);
}
