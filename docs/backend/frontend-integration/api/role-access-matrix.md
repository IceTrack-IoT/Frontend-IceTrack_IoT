# Role access matrix

Every endpoint grouped by who may call it, derived from `@PreAuthorize` and the security configuration. "Owner or technician" endpoints still apply ownership / assignment scoping in the application layer (an unreachable resource answers 404). See [../security/authentication.md](../security/authentication.md).

## Anonymous (9)

| Method | Path | Summary | Context |
|---|---|---|---|
| `POST` | `/api/v1/authentication/sign-in/local` | Sign in with local credentials | iam |
| `POST` | `/api/v1/authentication/sign-up/owner` | Sign up an owner with local credentials | iam |
| `POST` | `/api/v1/authentication/sign-up/technician` | Sign up a technician with local credentials | iam |
| `POST` | `/api/v1/authentication/google/verify` | Verify a Google id_token and sign in a registered account | iam |
| `POST` | `/api/v1/authentication/google/link` | Link a Google account to an existing password account | iam |
| `POST` | `/api/v1/authentication/google/complete-registration/owner` | Complete the registration of a Google account as an owner | iam |
| `POST` | `/api/v1/authentication/google/complete-registration/technician` | Complete the registration of a Google account as a technician | iam |
| `POST` | `/api/v1/authentication/refresh-token` | Refresh the session tokens | iam |
| `POST` | `/api/v1/authentication/logout` | Sign out | iam |

## Any authenticated user (owner or technician) (15)

| Method | Path | Summary | Context |
|---|---|---|---|
| `GET` | `/api/v1/authentication/me` | Get the current user | iam |
| `GET` | `/api/v1/roles` | Get all roles | iam |
| `GET` | `/api/v1/users` | Get my account | iam |
| `GET` | `/api/v1/users/{userId}` | Get user by ID | iam |
| `GET` | `/api/v1/profiles/owners/{ownerId}` | Get owner by ID | profiles |
| `GET` | `/api/v1/profiles/owners/user/{userId}` | Get owner by user ID | profiles |
| `GET` | `/api/v1/profiles/technicians/{technicianId}` | Get technician by ID | profiles |
| `GET` | `/api/v1/profiles/technicians/user/{userId}` | Get technician by user ID | profiles |
| `PUT` | `/api/v1/notifications/device-tokens` | Register device token | notifications |
| `DELETE` | `/api/v1/notifications/device-tokens` | Unregister device token | notifications |
| `GET` | `/api/v1/notifications` | List my notifications | notifications |
| `GET` | `/api/v1/notifications/unread-count` | Count my unread notifications | notifications |
| `GET` | `/api/v1/notifications/{notificationId}` | Get notification by ID | notifications |
| `PUT` | `/api/v1/notifications/{notificationId}/read` | Mark notification as read | notifications |
| `PUT` | `/api/v1/notifications/{notificationId}/dismiss` | Dismiss notification | notifications |

## OWNER_ROLE only (web) (38)

| Method | Path | Summary | Context |
|---|---|---|---|
| `GET` | `/api/v1/profiles/owners` | Get all owners | profiles |
| `GET` | `/api/v1/profiles/technicians` | Get all technicians | profiles |
| `GET` | `/api/v1/profiles/technicians/public` | Get the public technician directory | profiles |
| `GET` | `/api/v1/profiles/technicians/{technicianId}/public` | Get the public profile of a technician | profiles |
| `POST` | `/api/v1/assets/equipments` | Register an equipment | assets |
| `GET` | `/api/v1/assets/equipments` | List my equipment | assets |
| `GET` | `/api/v1/assets/equipments/directory` | Get my equipment directory | assets |
| `PUT` | `/api/v1/assets/equipments/{equipmentId}` | Update an equipment | assets |
| `PUT` | `/api/v1/assets/equipments/{equipmentId}/threshold` | Change the temperature threshold | assets |
| `PUT` | `/api/v1/assets/equipments/{equipmentId}/status` | Change the equipment status | assets |
| `POST` | `/api/v1/assets/sites/validate-address` | Verify a site address | assets |
| `POST` | `/api/v1/assets/sites` | Register a site | assets |
| `GET` | `/api/v1/assets/sites` | List my sites | assets |
| `PUT` | `/api/v1/assets/sites/{siteId}` | Update a site | assets |
| `PUT` | `/api/v1/assets/sites/{siteId}/address` | Change the address of a site | assets |
| `POST` | `/api/v1/devices` | Pair a device with an owned equipment unit | device |
| `GET` | `/api/v1/devices/{deviceId}` | Get a device by ID | device |
| `GET` | `/api/v1/devices` | List my devices | device |
| `POST` | `/api/v1/devices/{deviceId}/unpair` | Unpair a device | device |
| `POST` | `/api/v1/devices/{deviceId}/rotate-api-key` | Rotate the API key of a device | device |
| `PUT` | `/api/v1/devices/{deviceId}/status` | Change the lifecycle status of a device | device |
| `GET` | `/api/v1/alert-policies` | Get the alert policies applicable to my equipment | monitoring |
| `PUT` | `/api/v1/alert-policies` | Create or update an alert policy | monitoring |
| `GET` | `/api/v1/alerts` | List my alerts | monitoring |
| `GET` | `/api/v1/dashboard/summary` | Get my dashboard summary | monitoring |
| `PUT` | `/api/v1/alerts/{alertId}/acknowledge` | Acknowledge an alert | monitoring |
| `PUT` | `/api/v1/alerts/{alertId}/resolve` | Resolve an alert | monitoring |
| `PUT` | `/api/v1/alerts/{alertId}/dismiss` | Dismiss an alert | monitoring |
| `GET` | `/api/v1/maintenance-windows` | List the maintenance windows of a unit | monitoring |
| `POST` | `/api/v1/telemetry/stream-ticket` | Issue a telemetry stream ticket | monitoring |
| `POST` | `/api/v1/reports` | Request a new report | reporting |
| `GET` | `/api/v1/reports/{reportId}` | Get a report by id | reporting |
| `GET` | `/api/v1/reports` | List my reports | reporting |
| `POST` | `/api/v1/reviews` | Submit a review | service-request |
| `PUT` | `/api/v1/reviews/{reviewId}` | Update a review | service-request |
| `POST` | `/api/v1/service-requests` | Create a service request | service-request |
| `PUT` | `/api/v1/service-requests/{serviceRequestId}/assign` | Assign a technician | service-request |
| `PUT` | `/api/v1/service-requests/{serviceRequestId}/cancel` | Cancel a service request | service-request |

## TECHNICIAN_ROLE only (mobile) (5)

| Method | Path | Summary | Context |
|---|---|---|---|
| `POST` | `/api/v1/interventions` | Register an intervention | service-request |
| `PUT` | `/api/v1/service-requests/{serviceRequestId}/accept` | Accept a service request | service-request |
| `POST` | `/api/v1/service-requests/{serviceRequestId}/edge-grant` | Regenerate the edge grant of a service request | service-request |
| `PUT` | `/api/v1/service-requests/{serviceRequestId}/reject` | Reject a service request | service-request |
| `PUT` | `/api/v1/service-requests/{serviceRequestId}/start` | Start a service request | service-request |

## OWNER_ROLE or TECHNICIAN_ROLE (11)

| Method | Path | Summary | Context |
|---|---|---|---|
| `GET` | `/api/v1/assets/equipments/{equipmentId}` | Get an equipment by ID | assets |
| `GET` | `/api/v1/assets/sites/{siteId}` | Get a site by ID | assets |
| `GET` | `/api/v1/assets/sites/{siteId}/equipments` | List the equipment of a site | assets |
| `GET` | `/api/v1/alert-policies/equipment/{equipmentId}` | Get alert policy by equipment | monitoring |
| `GET` | `/api/v1/alerts/{alertId}` | Get alert by ID | monitoring |
| `GET` | `/api/v1/alerts/equipment/{equipmentId}/open` | Get open alerts by equipment | monitoring |
| `GET` | `/api/v1/telemetry/equipment/{equipmentId}` | Get reading history by equipment | monitoring |
| `GET` | `/api/v1/assets/equipments/{equipmentId}/interventions` | List the interventions of an equipment | service-request |
| `GET` | `/api/v1/service-requests` | List my service requests | service-request |
| `GET` | `/api/v1/service-requests/{serviceRequestId}` | Get a service request by ID | service-request |
| `GET` | `/api/v1/service-requests/{serviceRequestId}/review` | Get the review of a service request | service-request |

## Stream ticket (web, owner) (1)

| Method | Path | Summary | Context |
|---|---|---|---|
| `GET` | `/api/v1/telemetry/stream` | Open the telemetry stream | monitoring |

## Device API key (edge, not a frontend) (3)

| Method | Path | Summary | Context |
|---|---|---|---|
| `GET` | `/api/v1/devices/me/config` | Poll the edge configuration | device |
| `POST` | `/api/v1/telemetry/events` | Record an edge event | monitoring |
| `POST` | `/api/v1/telemetry` | Record an aggregated reading batch | monitoring |

## Account-scoped: caller must be the account in the path/body (`user_id`) (6)

| Method | Path | Summary | Context |
|---|---|---|---|
| `GET` | `/api/v1/profiles/dashboard-configs/user/{userId}` | Get dashboard configuration by user ID | profiles |
| `POST` | `/api/v1/profiles/dashboard-configs` | Create a dashboard configuration | profiles |
| `PUT` | `/api/v1/profiles/dashboard-configs/user/{userId}/layout` | Update the dashboard layout | profiles |
| `PATCH` | `/api/v1/profiles/dashboard-configs/user/{userId}/cards/{cardId}/visibility` | Toggle a dashboard card's visibility | profiles |
| `POST` | `/api/v1/profiles/dashboard-configs/user/{userId}/reset-defaults` | Reset the dashboard layout | profiles |
| `PUT` | `/api/v1/profiles/dashboard-configs/user/{userId}/defaults` | Update dashboard defaults | profiles |

## Account-scoped: OWNER_ROLE and the owner profile must be the caller's own (1)

| Method | Path | Summary | Context |
|---|---|---|---|
| `PUT` | `/api/v1/profiles/owners/{ownerId}` | Update an owner | profiles |

## Account-scoped: TECHNICIAN_ROLE and the technician profile must be the caller's own (1)

| Method | Path | Summary | Context |
|---|---|---|---|
| `PUT` | `/api/v1/profiles/technicians/{technicianId}` | Update a technician | profiles |
