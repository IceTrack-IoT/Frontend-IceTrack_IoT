export const environment = {
  production: false,
  iceTrackProviderApiBaseUrl: 'http://localhost:8080/api/v1',

  /** API endpoint paths */
  iceTrackProviderUsersEndpointPath: '/users',

  /** Authentication endpoints */
  iceTrackProviderMeEndpointPath: '/authentication/me',
  iceTrackProviderAuthenticationLocalEndpointPath: '/authentication/sign-in/local',
  iceTrackProviderSignUpOwnerEndpointPath: '/authentication/sign-up/owner',
  iceTrackProviderSignUpTechnicianEndpointPath: '/authentication/sign-up/technician',
  iceTrackProviderAuthenticationGoogleVerifyEndpointPath: '/authentication/google/verify',
  iceTrackProviderCompleteRegistrationOwnerEndpointPath: '/authentication/google/complete-registration/owner',
  iceTrackProviderCompleteRegistrationTechnicianEndpointPath: '/authentication/google/complete-registration/technician',
  iceTrackProviderRefreshTokensEndpointPath: '/authentication/refresh-token',
  iceTrackProviderLogoutEndpointPath: '/authentication/logout',

  /** Google Identity Services */
  googleClientId: '',
};
