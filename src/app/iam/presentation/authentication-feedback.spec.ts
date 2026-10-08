import { localSignInErrorKey, registrationErrorKey } from './authentication-feedback';

describe('localSignInErrorKey', () => {
  it('uses one message for any rejected credential, whichever field was wrong', () => {
    expect(localSignInErrorKey('VALIDATION_ERROR')).toBe('iam.errors.invalidCredentials');
    expect(localSignInErrorKey('USER_NOT_FOUND')).toBe('iam.errors.invalidCredentials');
    expect(localSignInErrorKey(null)).toBe('iam.errors.invalidCredentials');
  });

  it('points federated accounts to Google sign-in', () => {
    expect(localSignInErrorKey('BUSINESS_RULE_VIOLATION')).toBe('iam.errors.federatedAccount');
  });
});

describe('registrationErrorKey', () => {
  it('asks to review the details when the backend rejects them as invalid', () => {
    expect(registrationErrorKey('VALIDATION_ERROR')).toBe('iam.errors.invalidRegistration');
  });

  it('falls back to a safe message for any other failure', () => {
    expect(registrationErrorKey(null)).toBe('iam.errors.registrationRejected');
    expect(registrationErrorKey('GOOGLE_ACCOUNT_NOT_FOUND')).toBe(
      'iam.errors.registrationRejected',
    );
  });
});
