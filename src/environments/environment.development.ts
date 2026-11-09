export const environment = {
  production: false,
  iceTrackProviderApiBaseUrl: 'http://localhost:8080/api/v1',

  /** Authentication endpoints */
  iceTrackProviderMeEndpointPath: '/authentication/me',
  iceTrackProviderAuthenticationLocalEndpointPath: '/authentication/sign-in/local',
  iceTrackProviderSignUpOwnerEndpointPath: '/authentication/sign-up/owner',
  iceTrackProviderAuthenticationGoogleVerifyEndpointPath: '/authentication/google/verify',
  iceTrackProviderLinkGoogleAccountEndpointPath: '/authentication/google/link',
  iceTrackProviderCompleteRegistrationOwnerEndpointPath:
    '/authentication/google/complete-registration/owner',
  iceTrackProviderRefreshTokensEndpointPath: '/authentication/refresh-token',
  iceTrackProviderLogoutEndpointPath: '/authentication/logout',

  /** Profile endpoints */
  iceTrackProviderOwnerProfilesEndpointPath: '/profiles/owners',
  iceTrackProviderGetOwnerProfileByUserIdEndpointPath: '/profiles/owners/user/{userId}',
  iceTrackProviderUpdateOwnerProfileEndpointPath: '/profiles/owners/{ownerId}',
  iceTrackProviderTechnicianProfilesEndpointPath: '/profiles/technicians',
  iceTrackProviderTechnicianPublicProfileEndpointPath: '/profiles/technicians/{technicianId}/public',
  iceTrackProviderCreateDashboardConfigEndpointPath: '/profiles/dashboard-configs',
  iceTrackProviderGetDashboardConfigByUserIdEndpointPath: '/profiles/dashboard-configs/user/{userId}',
  iceTrackProviderUpdateDashboardDefaultsEndpointPath: '/profiles/dashboard-configs/user/{userId}/defaults',
  iceTrackProviderUpdateDashboardLayoutEndpointPath: '/profiles/dashboard-configs/user/{userId}/layout',

  /** Assets endpoints */
  iceTrackProviderSitesEndpointPath: '/assets/sites',

  /** Notification endpoints */
  iceTrackProviderNotificationsEndpointPath: '/notifications',

  /** Google Identity Services */
  googleClientId: '',
};
