import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MOCK_LATENCY_MS } from '@shared/presentation/mock/mock-data-source';
import { ReportDetail } from './report-detail';

describe('ReportDetail', () => {
  let harness: RouterTestingHarness;

  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  };

  async function open(reportId: number): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'reports/:reportId', component: ReportDetail }]),
        provideTranslateService(),
        { provide: MOCK_LATENCY_MS, useValue: 0 },
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/reports/${reportId}`, ReportDetail);
    await settle();
    return harness.routeNativeElement as HTMLElement;
  }

  function downloadButton(element: HTMLElement): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('reporting.detail.downloadAs'),
    );
  }

  it('offers the download only once the report is completed', async () => {
    const element = await open(1);

    expect(element.textContent).toContain('reporting.status.COMPLETED');
    expect(downloadButton(element)).toBeDefined();
    expect(element.querySelectorAll('.report-detail__kpi').length).toBeGreaterThan(0);
  });

  it('does not offer the download while the report is generating, and checks its status', async () => {
    const element = await open(2);

    expect(element.textContent).toContain('reporting.status.GENERATING');
    expect(downloadButton(element)).toBeUndefined();

    Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('reporting.detail.checkStatus'))
      ?.click();
    await settle();

    expect(element.textContent).toContain('reporting.status.COMPLETED');
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'reporting.detail.nowCompleted',
    );
    expect(downloadButton(element)).toBeDefined();
  });

  it('explains a failed generation and offers to request it again', async () => {
    const element = await open(5);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'reporting.detail.failedTitle',
    );
    expect(downloadButton(element)).toBeUndefined();
    expect(element.querySelector('a[href^="/reports/new"]')?.getAttribute('href')).toBe(
      '/reports/new?type=TEMPERATURE_EXCURSION&format=EXCEL',
    );
  });
});
