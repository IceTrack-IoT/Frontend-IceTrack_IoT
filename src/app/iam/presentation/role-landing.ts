import { Role } from '@iam/domain/value-objects/role';

/**
 * The area of the web platform where an authenticated user lands. The web platform is owner-only:
 * technicians land on the technician redirect and any other role on the unauthorized view.
 */
export type RoleLanding = 'owner-home' | 'technician-redirect' | 'unauthorized';

export const ROLE_LANDING_URLS: Readonly<Record<RoleLanding, string>> = {
  'owner-home': '/dashboard',
  'technician-redirect': '/iam/technician-redirect',
  unauthorized: '/iam/unauthorized',
};

/**
 * Resolves the landing of an authenticated user from its role. This is the single post-authentication
 * routing decision of the web platform; views must not branch on the role themselves.
 * @param role - The role of the authenticated user.
 * @returns The landing of the user.
 */
export function roleLandingOf(role: Role): RoleLanding {
  switch (role) {
    case Role.OWNER_ROLE:
      return 'owner-home';
    case Role.TECHNICIAN_ROLE:
      return 'technician-redirect';
    default:
      return 'unauthorized';
  }
}
