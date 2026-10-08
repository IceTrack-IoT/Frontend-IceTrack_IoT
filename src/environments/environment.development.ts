export const environment = {
  production: false,
  iceTrackProviderApiBaseUrl: 'http://localhost:8080/api/v1',

  /** User endpoint */
  iceTrackProviderUsersEndpointPath: '/users',

  /** Authentication endpoints */
  iceTrackProviderMeEndpointPath: '/authentication/me',
  iceTrackProviderAuthenticationLocalEndpointPath: '/authentication/sign-in/local',
  iceTrackProviderSignUpOwnerEndpointPath: '/authentication/sign-up/owner',
  iceTrackProviderAuthenticationGoogleVerifyEndpointPath: '/authentication/google/verify',
  iceTrackProviderCompleteRegistrationOwnerEndpointPath:
    '/authentication/google/complete-registration/owner',
  iceTrackProviderRefreshTokensEndpointPath: '/authentication/refresh-token',
  iceTrackProviderLogoutEndpointPath: '/authentication/logout',

  /** Profile endpoints */
  iceTrackProviderOwnerProfilesEndpointPath: '/profiles/owners',
  iceTrackProviderTechnicianProfilesEndpointPath: '/profiles/technicians',

  /** Notification endpoints */
  iceTrackProviderNotificationsEndpointPath: '/notifications',

  /** Google Identity Services */
  googleClientId: '',
};
