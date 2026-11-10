# Consolidated REST endpoint inventory

90 endpoints across 8 bounded contexts, discovered from 24 controllers. Detailed contracts are in `api/<context>/endpoints.md`.

| Context | Method | Path | Auth | Request body | Controller.method |
|---|---|---|---|---|---|
| iam | `POST` | `/api/v1/authentication/sign-in/local` | Anonymous (no token) | `SignInWithLocalResource` | `AuthenticationController.signIn` |
| iam | `POST` | `/api/v1/authentication/sign-up/owner` | Anonymous (no token) | `SignUpOwnerResource` | `AuthenticationController.signUpOwner` |
| iam | `POST` | `/api/v1/authentication/sign-up/technician` | Anonymous (no token) | `SignUpTechnicianResource` | `AuthenticationController.signUpTechnician` |
| iam | `POST` | `/api/v1/authentication/google/verify` | Anonymous (no token) | `SignInWithGoogleResource` | `AuthenticationController.verifyGoogleAccount` |
| iam | `POST` | `/api/v1/authentication/google/link` | Anonymous (no token) | `LinkGoogleAccountResource` | `AuthenticationController.linkGoogleAccount` |
| iam | `POST` | `/api/v1/authentication/google/complete-registration/owner` | Anonymous (no token) | `CompleteGoogleOwnerRegistrationResource` | `AuthenticationController.completeGoogleOwnerRegistration` |
| iam | `POST` | `/api/v1/authentication/google/complete-registration/technician` | Anonymous (no token) | `CompleteGoogleTechnicianRegistrationResource` | `AuthenticationController.completeGoogleTechnicianRegistration` |
| iam | `POST` | `/api/v1/authentication/refresh-token` | Anonymous (no token) | `RefreshTokenResource` | `AuthenticationController.refreshToken` |
| iam | `POST` | `/api/v1/authentication/logout` | Anonymous (no token) | `RefreshTokenResource` | `AuthenticationController.signOut` |
| iam | `GET` | `/api/v1/authentication/me` | Authenticated (any valid bearer token) | none | `AuthenticationController.getCurrentUser` |
| iam | `GET` | `/api/v1/roles` | Authenticated (any valid bearer token) | none | `RolesController.getAllRoles` |
| iam | `GET` | `/api/v1/users` | Authenticated (any valid bearer token) | none | `UsersController.getAllUsers` |
| iam | `GET` | `/api/v1/users/{userId}` | Authenticated (any valid bearer token) | none | `UsersController.getUserById` |
| profiles | `GET` | `/api/v1/profiles/dashboard-configs/user/{userId}` | caller must be the account in the path/body (`user_id`) | none | `DashboardConfigsController.getDashboardConfigByUserId` |
| profiles | `POST` | `/api/v1/profiles/dashboard-configs` | caller must be the account in the path/body (`user_id`) | `CreateDashboardConfigResource` | `DashboardConfigsController.createDashboardConfig` |
| profiles | `PUT` | `/api/v1/profiles/dashboard-configs/user/{userId}/layout` | caller must be the account in the path/body (`user_id`) | `UpdateDashboardLayoutResource` | `DashboardConfigsController.updateLayout` |
| profiles | `PATCH` | `/api/v1/profiles/dashboard-configs/user/{userId}/cards/{cardId}/visibility` | caller must be the account in the path/body (`user_id`) | none | `DashboardConfigsController.toggleCardVisibility` |
| profiles | `POST` | `/api/v1/profiles/dashboard-configs/user/{userId}/reset-defaults` | caller must be the account in the path/body (`user_id`) | none | `DashboardConfigsController.resetToDefaults` |
| profiles | `PUT` | `/api/v1/profiles/dashboard-configs/user/{userId}/defaults` | caller must be the account in the path/body (`user_id`) | `UpdateDashboardDefaultsResource` | `DashboardConfigsController.updateDefaults` |
| profiles | `GET` | `/api/v1/profiles/owners` | OWNER_ROLE | none | `OwnerProfilesController.getAllOwners` |
| profiles | `GET` | `/api/v1/profiles/owners/{ownerId}` | Authenticated (any valid bearer token) | none | `OwnerProfilesController.getOwnerById` |
| profiles | `GET` | `/api/v1/profiles/owners/user/{userId}` | Authenticated (any valid bearer token) | none | `OwnerProfilesController.getOwnerByUserId` |
| profiles | `PUT` | `/api/v1/profiles/owners/{ownerId}` | OWNER_ROLE and the owner profile must be the caller's own | `UpdateOwnerResource` | `OwnerProfilesController.updateOwner` |
| profiles | `GET` | `/api/v1/profiles/technicians` | OWNER_ROLE | none | `TechnicianProfilesController.getAllTechnicians` |
| profiles | `GET` | `/api/v1/profiles/technicians/public` | OWNER_ROLE | none | `TechnicianProfilesController.getPublicTechnicianDirectory` |
| profiles | `GET` | `/api/v1/profiles/technicians/{technicianId}` | Authenticated (any valid bearer token) | none | `TechnicianProfilesController.getTechnicianById` |
| profiles | `GET` | `/api/v1/profiles/technicians/{technicianId}/public` | OWNER_ROLE | none | `TechnicianProfilesController.getTechnicianPublicProfile` |
| profiles | `GET` | `/api/v1/profiles/technicians/user/{userId}` | Authenticated (any valid bearer token) | none | `TechnicianProfilesController.getTechnicianByUserId` |
| profiles | `PUT` | `/api/v1/profiles/technicians/{technicianId}` | TECHNICIAN_ROLE and the technician profile must be the caller's own | `UpdateTechnicianResource` | `TechnicianProfilesController.updateTechnician` |
| assets | `POST` | `/api/v1/assets/equipments` | OWNER_ROLE | `RegisterEquipmentResource` | `EquipmentController.registerEquipment` |
| assets | `GET` | `/api/v1/assets/equipments` | OWNER_ROLE | none | `EquipmentController.getMyEquipment` |
| assets | `GET` | `/api/v1/assets/equipments/directory` | OWNER_ROLE | none | `EquipmentController.getMyEquipmentDirectory` |
| assets | `GET` | `/api/v1/assets/equipments/{equipmentId}` | OWNER_ROLE or TECHNICIAN_ROLE | none | `EquipmentController.getEquipmentById` |
| assets | `PUT` | `/api/v1/assets/equipments/{equipmentId}` | OWNER_ROLE | `UpdateEquipmentResource` | `EquipmentController.updateEquipment` |
| assets | `PUT` | `/api/v1/assets/equipments/{equipmentId}/threshold` | OWNER_ROLE | `ChangeThresholdResource` | `EquipmentController.changeThreshold` |
| assets | `PUT` | `/api/v1/assets/equipments/{equipmentId}/status` | OWNER_ROLE | `ChangeStatusResource` | `EquipmentController.changeStatus` |
| assets | `POST` | `/api/v1/assets/sites/validate-address` | OWNER_ROLE | `ValidateAddressResource` | `SiteController.validateAddress` |
| assets | `POST` | `/api/v1/assets/sites` | OWNER_ROLE | `RegisterSiteResource` | `SiteController.registerSite` |
| assets | `GET` | `/api/v1/assets/sites` | OWNER_ROLE | none | `SiteController.getMySites` |
| assets | `GET` | `/api/v1/assets/sites/{siteId}` | OWNER_ROLE or TECHNICIAN_ROLE | none | `SiteController.getSiteById` |
| assets | `GET` | `/api/v1/assets/sites/{siteId}/equipments` | OWNER_ROLE or TECHNICIAN_ROLE | none | `SiteController.getEquipmentBySite` |
| assets | `PUT` | `/api/v1/assets/sites/{siteId}` | OWNER_ROLE | `UpdateSiteResource` | `SiteController.updateSite` |
| assets | `PUT` | `/api/v1/assets/sites/{siteId}/address` | OWNER_ROLE | `UpdateSiteAddressResource` | `SiteController.updateSiteAddress` |
| device | `POST` | `/api/v1/devices` | OWNER_ROLE | `RegisterDeviceResource` | `DeviceController.registerDevice` |
| device | `GET` | `/api/v1/devices/{deviceId}` | OWNER_ROLE | none | `DeviceController.getDevice` |
| device | `GET` | `/api/v1/devices` | OWNER_ROLE | none | `DeviceController.getDevices` |
| device | `POST` | `/api/v1/devices/{deviceId}/unpair` | OWNER_ROLE | none | `DeviceController.unpairDevice` |
| device | `POST` | `/api/v1/devices/{deviceId}/rotate-api-key` | OWNER_ROLE | none | `DeviceController.rotateApiKey` |
| device | `PUT` | `/api/v1/devices/{deviceId}/status` | OWNER_ROLE | `ChangeDeviceStatusResource` | `DeviceController.changeStatus` |
| device | `GET` | `/api/v1/devices/me/config` | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT | none | `EdgeConfigurationController.getConfiguration` |
| monitoring | `GET` | `/api/v1/alert-policies` | OWNER_ROLE | none | `AlertPoliciesController.getApplicablePolicies` |
| monitoring | `GET` | `/api/v1/alert-policies/equipment/{equipmentId}` | OWNER_ROLE or TECHNICIAN_ROLE | none | `AlertPoliciesController.getPolicyByEquipment` |
| monitoring | `PUT` | `/api/v1/alert-policies` | OWNER_ROLE | `UpdateAlertPolicyResource` | `AlertPoliciesController.updatePolicy` |
| monitoring | `GET` | `/api/v1/alerts` | OWNER_ROLE | none | `AlertsController.getAlerts` |
| monitoring | `GET` | `/api/v1/alerts/{alertId}` | OWNER_ROLE or TECHNICIAN_ROLE | none | `AlertsController.getAlertById` |
| monitoring | `GET` | `/api/v1/alerts/equipment/{equipmentId}/open` | OWNER_ROLE or TECHNICIAN_ROLE | none | `AlertsController.getOpenAlertsByEquipment` |
| monitoring | `PUT` | `/api/v1/alerts/{alertId}/acknowledge` | OWNER_ROLE | none | `AlertsController.acknowledgeAlert` |
| monitoring | `PUT` | `/api/v1/alerts/{alertId}/resolve` | OWNER_ROLE | none | `AlertsController.resolveAlert` |
| monitoring | `PUT` | `/api/v1/alerts/{alertId}/dismiss` | OWNER_ROLE | `DismissAlertResource` | `AlertsController.dismissAlert` |
| monitoring | `GET` | `/api/v1/dashboard/summary` | OWNER_ROLE | none | `DashboardSummaryController.getDashboardSummary` |
| monitoring | `POST` | `/api/v1/telemetry/events` | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT | `RecordEdgeEventResource` | `EdgeEventsController.recordEvent` |
| monitoring | `GET` | `/api/v1/maintenance-windows` | OWNER_ROLE | none | `MaintenanceWindowsController.getMaintenanceWindows` |
| monitoring | `POST` | `/api/v1/telemetry` | Device API key (`X-API-Key`), authority `DEVICE_ROLE`; no user JWT | `RecordReadingBatchResource` | `TelemetryController.recordReading` |
| monitoring | `GET` | `/api/v1/telemetry/equipment/{equipmentId}` | OWNER_ROLE or TECHNICIAN_ROLE | none | `TelemetryController.getReadingsByEquipment` |
| monitoring | `POST` | `/api/v1/telemetry/stream-ticket` | OWNER_ROLE | none | `TelemetryStreamController.issueStreamTicket` |
| monitoring | `GET` | `/api/v1/telemetry/stream` | None (no JWT). Single-use stream ticket in `?ticket=` | none | `TelemetryStreamController.openStream` |
| notifications | `PUT` | `/api/v1/notifications/device-tokens` | Authenticated (any valid bearer token) | `RegisterDeviceTokenResource` | `DeviceTokensController.registerDeviceToken` |
| notifications | `DELETE` | `/api/v1/notifications/device-tokens` | Authenticated (any valid bearer token) | none | `DeviceTokensController.unregisterDeviceToken` |
| notifications | `GET` | `/api/v1/notifications` | Authenticated (any valid bearer token) | none | `NotificationsController.listMyNotifications` |
| notifications | `GET` | `/api/v1/notifications/unread-count` | Authenticated (any valid bearer token) | none | `NotificationsController.countMyUnreadNotifications` |
| notifications | `GET` | `/api/v1/notifications/{notificationId}` | Authenticated (any valid bearer token) | none | `NotificationsController.getNotificationById` |
| notifications | `PUT` | `/api/v1/notifications/{notificationId}/read` | Authenticated (any valid bearer token) | none | `NotificationsController.markNotificationAsRead` |
| notifications | `PUT` | `/api/v1/notifications/{notificationId}/dismiss` | Authenticated (any valid bearer token) | none | `NotificationsController.dismissNotification` |
| reporting | `POST` | `/api/v1/reports` | OWNER_ROLE | `CreateReportResource` | `ReportsController.requestReport` |
| reporting | `GET` | `/api/v1/reports/{reportId}` | OWNER_ROLE | none | `ReportsController.getReportById` |
| reporting | `GET` | `/api/v1/reports` | OWNER_ROLE | none | `ReportsController.getReportsByUser` |
| service-request | `GET` | `/api/v1/assets/equipments/{equipmentId}/interventions` | OWNER_ROLE or TECHNICIAN_ROLE | none | `EquipmentInterventionsController.getEquipmentInterventions` |
| service-request | `POST` | `/api/v1/interventions` | TECHNICIAN_ROLE | `RegisterInterventionResource` | `InterventionsController.registerIntervention` |
| service-request | `POST` | `/api/v1/reviews` | OWNER_ROLE | `SubmitReviewResource` | `ReviewsController.submitReview` |
| service-request | `PUT` | `/api/v1/reviews/{reviewId}` | OWNER_ROLE | `UpdateReviewResource` | `ReviewsController.updateReview` |
| service-request | `POST` | `/api/v1/service-requests` | OWNER_ROLE | `CreateServiceRequestResource` | `ServiceRequestsController.createServiceRequest` |
| service-request | `GET` | `/api/v1/service-requests` | OWNER_ROLE or TECHNICIAN_ROLE | none | `ServiceRequestsController.listServiceRequests` |
| service-request | `GET` | `/api/v1/service-requests/{serviceRequestId}` | OWNER_ROLE or TECHNICIAN_ROLE | none | `ServiceRequestsController.getServiceRequestById` |
| service-request | `PUT` | `/api/v1/service-requests/{serviceRequestId}/assign` | OWNER_ROLE | `AssignTechnicianResource` | `ServiceRequestsController.assignTechnician` |
| service-request | `PUT` | `/api/v1/service-requests/{serviceRequestId}/accept` | TECHNICIAN_ROLE | none | `ServiceRequestsController.acceptServiceRequest` |
| service-request | `POST` | `/api/v1/service-requests/{serviceRequestId}/edge-grant` | TECHNICIAN_ROLE | none | `ServiceRequestsController.regenerateEdgeGrant` |
| service-request | `PUT` | `/api/v1/service-requests/{serviceRequestId}/reject` | TECHNICIAN_ROLE | `RejectServiceRequestResource` | `ServiceRequestsController.rejectServiceRequest` |
| service-request | `PUT` | `/api/v1/service-requests/{serviceRequestId}/start` | TECHNICIAN_ROLE | `StartServiceRequestResource` | `ServiceRequestsController.startServiceRequest` |
| service-request | `PUT` | `/api/v1/service-requests/{serviceRequestId}/cancel` | OWNER_ROLE | `CancelServiceRequestResource` | `ServiceRequestsController.cancelServiceRequest` |
| service-request | `GET` | `/api/v1/service-requests/{serviceRequestId}/review` | OWNER_ROLE or TECHNICIAN_ROLE | none | `ServiceRequestsController.getServiceRequestReview` |
