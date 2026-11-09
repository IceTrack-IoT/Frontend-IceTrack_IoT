import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AlertPolicyPort } from '@monitoring/application/ports/alert-policy.port';
import { AlertsPort } from '@monitoring/application/ports/alerts.port';
import { MonitoringStreamPort } from '@monitoring/application/ports/monitoring-stream.port';
import { TelemetryPort } from '@monitoring/application/ports/telemetry.port';
import { AlertPolicyApi } from '@monitoring/infrastructure/api/alert-policy-api';
import { AlertsApi } from '@monitoring/infrastructure/api/alerts-api';
import { TelemetryApi } from '@monitoring/infrastructure/api/telemetry-api';
import { MonitoringStreamApi } from '@monitoring/infrastructure/streaming/monitoring-stream-api';

/**
 * Binds the Monitoring and Alerting application ports to their infrastructure adapters. The equipment
 * directory and the active service request count ports are bound by Assets Management and Service Request
 * Management, which own that data.
 */
export function provideMonitoring(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AlertsPort, useExisting: AlertsApi },
    { provide: TelemetryPort, useExisting: TelemetryApi },
    { provide: AlertPolicyPort, useExisting: AlertPolicyApi },
    { provide: MonitoringStreamPort, useExisting: MonitoringStreamApi },
  ]);
}
