import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ReportsPort } from '@reporting/application/ports/reports.port';
import { ReportsApi } from '@reporting/infrastructure/api/reports-api';

/**
 * Binds the Reporting application ports to their infrastructure adapters. The report scope port is bound
 * by Assets Management, which owns the sites and equipment.
 */
export function provideReporting(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ReportsPort, useExisting: ReportsApi }]);
}
