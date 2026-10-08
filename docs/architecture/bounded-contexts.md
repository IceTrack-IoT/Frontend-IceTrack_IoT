# IceTrack Web Bounded Contexts

## Overview

The web application implements presentation and client-side orchestration for the IceTrack bounded contexts. It does not own backend processing, device firmware, Edge API logic, or mobile workflows.

## Context map

| Folder | Bounded Context | Web responsibilities | Not owned by web context |
|---|---|---|---|
| `iam` | IAM | Registration, login, Google OAuth interaction, protected routes, session UI state | JWT validation, backend identity linking, token issuing |
| `profiles` | Profiles and Preferences Management | Professional profile screens, language selection, dashboard configuration | Cross-channel sync implementation and backend preference persistence |
| `assets` | Assets Management | Sites/equipment CRUD UI, filtering, threshold configuration, equipment detail navigation | Asset persistence and backend validation |
| `devices` | Device Management | Device pairing UI, device state display, rotate/revoke credential actions | Physical device provisioning, API key generation/invalidation |
| `monitoring` | Monitoring and Alerting | Dashboard, charts, telemetry views, alert list/detail/actions, live stream consumption | Telemetry ingestion, threshold engine, alert engine |
| `service-requests` | Service Request Management | Create/list/detail/filter/cancel/assign flows, history, intervention viewing, reviews | Field intervention execution and service state-machine enforcement |
| `notifications` | Notifications | Notification center, unread count, read/dismiss actions | Recipient resolution and message delivery |
| `reporting` | Reporting & Analytics | Report request, generation status, search/filter, detail/download | Metrics calculation, file generation, artifact storage |
| `shared` | Shared | Generic UI and technical primitives | Context-specific business behavior |

## IAM

### Language

- User
- Credential
- Session
- Access token
- Refresh token
- Authentication
- Authorization
- Identity provider
- Protected route

### Web responsibilities

- Render registration and login flows.
- Support Google OAuth UI flow through IAM abstractions.
- Restore session UI state.
- Protect authenticated routes.
- Surface safe translated errors.
- Support sign-out.

## Profiles and Preferences Management

### Language

- Professional profile
- Specialty
- Certification number
- Language preference
- Dashboard card
- Visibility
- Position
- Dashboard configuration

### Web responsibilities

- Render and edit technician/owner profile data when available.
- Render language selection.
- Render dashboard card configuration.
- Persist changes through application ports/adapters.
- Reflect selected language and dashboard card ordering.

## Assets Management

### Language

- Site
- Equipment
- Equipment code
- Equipment type
- Equipment status
- Temperature threshold
- Minimum temperature
- Maximum temperature
- Maintenance interval

### Web responsibilities

- List, filter, create, and edit sites.
- List, filter, create, and edit refrigeration equipment.
- Show equipment status, site, type, code, and latest known temperature.
- Configure and view temperature thresholds.
- Navigate to device, monitoring, service history, and alert information by equipment identifier.

## Device Management

### Language

- Monitoring device
- Device identifier
- Pairing
- Unpairing
- Device credential
- Credential rotation
- Credential revocation
- Paired state

### Web responsibilities

- Render device pairing to an equipment item.
- Show paired-device information in equipment/device views.
- Request credential rotation or revocation through the backend.
- Treat issued device credentials as sensitive one-time information.
- Show safe device state and association information.

## Monitoring and Alerting

### Language

- Telemetry
- Temperature reading
- Current measurement
- Historical reading
- Time series
- Excursion
- Thermal alert
- Connectivity alert
- Severity
- Acknowledged
- Resolved
- Dismissed
- Offline device

### Web responsibilities

- Render dashboard metrics.
- Render current temperature and last-known telemetry.
- Render historical temperature charts.
- Subscribe to and render live dashboard updates where supported.
- Render thermal/connectivity alert details.
- Request acknowledgement/dismissal actions.
- Navigate to or initiate a corrective service request draft from a critical alert.
- Show offline device state received from backend.

## Service Request Management

### Language

- Service request
- Order number
- Preventive maintenance
- Repair
- Priority
- Pending
- Accepted
- In progress
- Completed
- Canceled
- Technician assignment
- Intervention
- Service history
- Review
- Rating

### Web responsibilities

- Create preventive maintenance or repair requests.
- Show service request confirmation with order, equipment, site, and service type.
- List/filter service requests.
- Show status and transition history.
- Cancel requests with a reason when allowed.
- Show technician data needed for assignment.
- Assign a technician when allowed.
- Show equipment intervention history.
- Create/update service reviews where allowed.
- Show service reports provided by reporting context.

## Notifications

### Language

- Notification
- Unread
- Read
- Dismissed
- Severity
- Delivery date
- Notification type
- Notification center

### Web responsibilities

- List notifications.
- Show unread count.
- Mark notifications as read.
- Dismiss notifications.
- Navigate to related equipment, alert, or service request using IDs supplied by the notification.

## Reporting & Analytics

### Language

- Report
- Report type
- Generation status
- Pending
- Completed
- Failed
- Export
- Artifact
- Date range
- Thermal excursion
- Chain-of-cold indicator

### Web responsibilities

- Search/filter reports.
- Request report generation.
- Poll or refresh report status according to backend contract.
- Show report success/failure state.
- Enable download only when artifact is available.
- Show the selected report format such as PDF, Excel, or CSV.
- Show thermal excursion report input filters and result status.

## Cross-context flows

### Equipment detail

The equipment detail experience may compose data from multiple contexts while preserving ownership:

```text
Assets
  -> equipment identity, site, metadata, threshold

Devices
  -> paired device state/credential actions

Monitoring
  -> current temperature, telemetry history, recent alerts

Service Requests
  -> intervention history and service-request navigation
```

Each context must expose only the contract required by the composition. Do not merge all business logic into an equipment screen component.

### Critical alert to corrective service

```text
Monitoring alert
  -> owner selects "Generate service request"
  -> route/application draft carries alert context
  -> Service Requests form pre-fills equipment, site, REPAIR type, alert context
  -> owner confirms
  -> Service Requests creates the request
```

### Dashboard preferences

```text
Profiles
  -> card visibility and ordering preference

Monitoring
  -> card metrics/data

Presentation
  -> composes enabled cards in persisted order
```

Preferences do not own monitoring data; monitoring does not own card configuration.
