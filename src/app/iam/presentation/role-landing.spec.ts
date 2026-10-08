import { Role } from '@iam/domain/value-objects/role';
import { ROLE_LANDING_URLS, roleLandingOf } from './role-landing';

describe('roleLandingOf', () => {
  it('lands owners on the owner dashboard', () => {
    const landing = roleLandingOf(Role.OWNER_ROLE);

    expect(landing).toBe('owner-home');
    expect(ROLE_LANDING_URLS[landing]).toBe('/dashboard');
  });

  it('lands technicians on the technician redirect, outside the owner platform', () => {
    const landing = roleLandingOf(Role.TECHNICIAN_ROLE);

    expect(landing).toBe('technician-redirect');
    expect(ROLE_LANDING_URLS[landing]).toBe('/iam/technician-redirect');
  });

  it('lands unsupported roles on the unauthorized view', () => {
    const landing = roleLandingOf('ADMIN_ROLE' as unknown as Role);

    expect(landing).toBe('unauthorized');
    expect(ROLE_LANDING_URLS[landing]).toBe('/iam/unauthorized');
  });
});
