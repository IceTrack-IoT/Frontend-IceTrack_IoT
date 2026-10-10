export const environment = {
  production: true,
  iceTrackProviderApiBaseUrl: 'https://platform-icetrackiot-production.up.railway.app/api/v1',

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
  iceTrackProviderGetOwnerProfileByUserIdEndpointPath: '/profiles/owners/user/{userId}',
  iceTrackProviderTechnicianProfilesEndpointPath: '/profiles/technicians',
  iceTrackProviderCreateDashboardConfigEndpointPath: '/profiles/dashboard-configs',
  iceTrackProviderResetDashboardLayoutEndpointPath: '/profiles/dashboard-configs/user/{userId}/reset-defaults',
  iceTrackProviderGetDashboardConfigByUserIdEndpointPath: '/profiles/dashboard-configs/user/{userId}',
  iceTrackProviderToggleDashboardCardVisibilityEndpointPath: '/profiles/dashboard-configs/user/{userId}/cards/{cardId}/toggle-visibility',
  iceTrackProviderUpdateDashboardDefaultsEndpointPath: '/profiles/dashboard-configs/user/{userId}/defaults',
  iceTrackProviderUpdateDashboardLayoutEndpointPath: '/profiles/dashboard-configs/user/{userId}/layout',

  /** Notification endpoints */
  iceTrackProviderNotificationsEndpointPath: '/notifications',

  /** Google Identity Services */
  googleClientId: '',
};
