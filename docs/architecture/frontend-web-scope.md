# IceTrack Web Application Scope

## Purpose

This document defines what belongs to the Angular web application and what is excluded.

The web application serves primarily business owners who operate refrigerated assets and need to monitor their cold chain, manage equipment, create maintenance requests, and consult operational information.

## Included web user stories

| User Story | Web capability | Owning bounded context |
|---|---|---|
| US-01 | Register a user with owner or technician role | IAM |
| US-02 | Sign in with account credentials | IAM |
| US-03 | Register and update refrigeration equipment | Assets Management |
| US-04 | Create preventive/corrective service request | Service Request Management |
| US-05 | Track service request progress/history | Service Request Management |
| US-06 | Cancel a service request with reason when permitted | Service Request Management |
| US-07 | Complete technician professional profile when exposed in web | Profiles and Preferences Management |
| US-08 | View technician profile for assignment | Profiles and Preferences Management |
| US-09 | Assign a technician to a service request | Service Request Management |
| US-10 | View equipment intervention history | Service Request Management |
| US-11 | Filter equipment by site, type, and state | Assets Management |
| US-12 | Review completed service within allowed window | Service Request Management |
| US-18 | List and view equipment detail | Assets Management |
| US-19 | View dashboard and live telemetry | Monitoring and Alerting |
| US-20 | Register and list sites | Assets Management |
| US-21 | List and filter service requests | Service Request Management |
| US-22 | Search/filter reports | Reporting & Analytics |
| US-23 | Change web interface language | Profiles and Preferences Management |
| US-24 | View and download service report | Reporting & Analytics |
| US-25 | View and manually refresh dashboard metrics | Monitoring and Alerting |
| US-27 | View current and historical equipment telemetry | Monitoring and Alerting |
| US-29 | Understand alert and draft corrective service request | Monitoring and Alerting + Service Request Management |
| US-34 | Sign in/register with Google OAuth 2.0 | IAM |
| US-35 | Configure dashboard cards/order/visibility | Profiles and Preferences Management |
| US-36 | Configure equipment temperature threshold | Assets Management |
| US-37 | Pair monitoring device with equipment | Device Management |
| US-38 | Rotate/revoke device credential | Device Management |
| US-41 | Acknowledge or dismiss alerts | Monitoring and Alerting |
| US-42 | View offline-device state/alerts | Monitoring and Alerting |
| US-43 | View, read, and dismiss notifications | Notifications |
| US-45 | Request/view thermal excursion report | Reporting & Analytics |

## Conditional web scope

These stories can have web presentation, but backend or mobile behavior must not be implemented in the web frontend:

| User Story | Allowed web responsibility | Excluded responsibility |
|---|---|---|
| US-05 | Show status changes made by technicians | Technician mobile status update implementation |
| US-19 | Subscribe/render live telemetry | Cloud ingestion and streaming backend implementation |
| US-24 | Request, show status, and download available reports | Server-side report generation |
| US-27 | Render telemetry history/current values | Telemetry persistence and aggregation |
| US-29 | Prefill a service request from an alert | Automatic backend request creation without confirmation |
| US-37 | UI to pair a device | Device API key issuance implementation |
| US-38 | UI to rotate/revoke credentials | Credential generation/invalidation implementation |
| US-41 | UI to request alert transitions | Alert lifecycle engine implementation |
| US-42 | Render offline status/alerts | Backend silence detection logic |
| US-45 | Request/filter/show analytical report | Server-side indicator calculation |

## Technical stories relevant to web integration

The web frontend can consume contracts resulting from:

| Technical Story | Web relevance |
|---|---|
| TS-01 | Service request creation UI/API adapter |
| TS-03 | Service review create/update UI/API adapter |
| TS-04 | User registration UI/API adapter |
| TS-05 | Service request detail/status history UI/API adapter |
| TS-08 | Device pair/unpair/credential rotation UI/API adapter |
| TS-13 | Real-time telemetry dashboard subscription adapter |
| TS-14 | Service request transition/assignment UI/API adapter |
| TS-16 | Async report generation/status/download UI/API adapter |
