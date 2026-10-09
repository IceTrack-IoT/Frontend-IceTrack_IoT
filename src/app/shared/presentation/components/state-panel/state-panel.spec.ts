import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { StatePanel, type StatePanelKind } from './state-panel';

describe('StatePanel', () => {
  let fixture: ComponentFixture<StatePanel>;
  let element: HTMLElement;

  async function render(kind: StatePanelKind, message: string | null = null): Promise<void> {
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('heading', 'Loading sites…');
    fixture.componentRef.setInput('message', message);
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(StatePanel);
    element = fixture.nativeElement as HTMLElement;
  });

  it('announces loading as a busy status', async () => {
    await render('loading');

    const status = element.querySelector('[role="status"]');
    expect(status?.getAttribute('aria-busy')).toBe('true');
    expect(status?.textContent).toContain('Loading sites…');
  });

  it('announces errors as alerts with their message', async () => {
    await render('error', 'Check your connection.');

    const alert = element.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Check your connection.');
  });

  it('announces empty results as a status', async () => {
    await render('empty');

    expect(element.querySelector('[role="status"]')).not.toBeNull();
    expect(element.querySelector('[aria-busy]')).toBeNull();
  });
});
