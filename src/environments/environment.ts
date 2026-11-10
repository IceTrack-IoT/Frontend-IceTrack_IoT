export const environment = {
  production: true,
  iceTrackProviderApiBaseUrl: 'https://platform-icetrackiot-production.up.railway.app/api/v1',

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
  iceTrackProviderTechnicianPublicDirectoryEndpointPath: '/profiles/technicians/public',
  iceTrackProviderTechnicianPublicProfileEndpointPath:
    '/profiles/technicians/{technicianId}/public',
  iceTrackProviderCreateDashboardConfigEndpointPath: '/profiles/dashboard-configs',
  iceTrackProviderGetDashboardConfigByUserIdEndpointPath:
    '/profiles/dashboard-configs/user/{userId}',
  iceTrackProviderUpdateDashboardDefaultsEndpointPath:
    '/profiles/dashboard-configs/user/{userId}/defaults',
  iceTrackProviderUpdateDashboardLayoutEndpointPath:
    '/profiles/dashboard-configs/user/{userId}/layout',

  /** Assets endpoints */
  iceTrackProviderSitesEndpointPath: '/assets/sites',
  iceTrackProviderEquipmentEndpointPath: '/assets/equipments',
  iceTrackProviderEquipmentDirectoryEndpointPath: '/assets/equipments/directory',
  iceTrackProviderValidateSiteAddressEndpointPath: '/assets/sites/validate-address',
  iceTrackProviderSiteByIdEndpointPath: '/assets/sites/{siteId}',
  iceTrackProviderSiteAddressEndpointPath: '/assets/sites/{siteId}/address',
  iceTrackProviderEquipmentByIdEndpointPath: '/assets/equipments/{equipmentId}',
  iceTrackProviderEquipmentThresholdEndpointPath: '/assets/equipments/{equipmentId}/threshold',
  iceTrackProviderEquipmentStatusEndpointPath: '/assets/equipments/{equipmentId}/status',

  /** Device management endpoints */
  iceTrackProviderDevicesEndpointPath: '/devices',
  iceTrackProviderUnpairDeviceEndpointPath: '/devices/{deviceId}/unpair',
  iceTrackProviderRotateDeviceApiKeyEndpointPath: '/devices/{deviceId}/rotate-api-key',
  iceTrackProviderDeviceStatusEndpointPath: '/devices/{deviceId}/status',

  /** Service request endpoints */
  iceTrackProviderServiceRequestsEndpointPath: '/service-requests',
  iceTrackProviderServiceRequestByIdEndpointPath: '/service-requests/{serviceRequestId}',
  iceTrackProviderAssignTechnicianEndpointPath: '/service-requests/{serviceRequestId}/assign',
  iceTrackProviderCancelServiceRequestEndpointPath: '/service-requests/{serviceRequestId}/cancel',
  iceTrackProviderServiceRequestReviewEndpointPath: '/service-requests/{serviceRequestId}/review',
  iceTrackProviderReviewsEndpointPath: '/reviews',
  iceTrackProviderReviewByIdEndpointPath: '/reviews/{reviewId}',
  iceTrackProviderEquipmentInterventionsEndpointPath:
    '/assets/equipments/{equipmentId}/interventions',

  /** Notification endpoints */
  iceTrackProviderNotificationsEndpointPath: '/notifications',
  iceTrackProviderUnreadNotificationCountEndpointPath: '/notifications/unread-count',
  iceTrackProviderMarkAllNotificationsAsReadEndpointPath: '/notifications/read-all',
  iceTrackProviderMarkNotificationAsReadEndpointPath: '/notifications/{notificationId}/read',
  iceTrackProviderDismissNotificationEndpointPath: '/notifications/{notificationId}/dismiss',

  /** Reporting endpoints */
  iceTrackProviderReportsEndpointPath: '/reports',
  iceTrackProviderReportByIdEndpointPath: '/reports/{reportId}',
  iceTrackProviderReportDownloadLinkEndpointPath: '/reports/{reportId}/download-link',

  /** Monitoring and alerting endpoints */
  iceTrackProviderAlertsEndpointPath: '/alerts',
  iceTrackProviderAlertByIdEndpointPath: '/alerts/{alertId}',
  iceTrackProviderActiveAlertsByEquipmentEndpointPath: '/alerts/equipment/{equipmentId}/open',
  iceTrackProviderAcknowledgeAlertEndpointPath: '/alerts/{alertId}/acknowledge',
  iceTrackProviderResolveAlertEndpointPath: '/alerts/{alertId}/resolve',
  iceTrackProviderDismissAlertEndpointPath: '/alerts/{alertId}/dismiss',
  iceTrackProviderAlertPolicyByEquipmentEndpointPath: '/alert-policies/equipment/{equipmentId}',
  iceTrackProviderReadingHistoryEndpointPath: '/telemetry/equipment/{equipmentId}',
  iceTrackProviderTelemetryStreamTicketEndpointPath: '/telemetry/stream-ticket',
  iceTrackProviderTelemetryStreamEndpointPath: '/telemetry/stream',
  iceTrackProviderDashboardSummaryEndpointPath: '/dashboard/summary',

  /** Google Identity Services */
  googleClientId: '235296518162-amt44u4ha0908lh9oa5h23lifb5jbi07.apps.googleusercontent.com',

  /**
   * Google Maps JavaScript API key, restricted to the web origins of the platform. The site maps are
   * hidden while it is empty.
   */
  googleMapsApiKey: 'AIzaSyA4HhgkVL6MFXDrxsnaeO62aAWe2o4ufjU',
};
