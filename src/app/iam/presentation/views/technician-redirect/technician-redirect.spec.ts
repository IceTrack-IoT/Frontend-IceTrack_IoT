import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '@iam/application/iam-store';
import { TechnicianRedirect } from './technician-redirect';

const QR_CODE = 'img[alt="iam.technicianRedirect.qrAlt"]';

describe('TechnicianRedirect', () => {
  let store: { signOut: ReturnType<typeof vi.fn> };
  let router: Router;
  let fixture: ComponentFixture<TechnicianRedirect>;
  let element: HTMLElement;

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    store = { signOut: vi.fn() };
    TestBed.configureTestingModule({
      imports: [TechnicianRedirect],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: IamStore, useValue: store },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(TechnicianRedirect);
    element = fixture.nativeElement as HTMLElement;
    await render();
  });

  it('explains that technician operations live in the mobile application', () => {
    expect(element.querySelector('h1')?.textContent).toContain('iam.technicianRedirect.title');
    expect(element.textContent).toContain('iam.technicianRedirect.message');
  });

  it('shows the QR code with a meaningful text alternative', () => {
    const qrCode = element.querySelector(QR_CODE);

    expect(qrCode).not.toBeNull();
    expect(qrCode?.getAttribute('src')).toContain('assets/images/mobile-app-qr.png');
  });

  it('gives text instructions that do not rely on the QR code', () => {
    expect(element.querySelectorAll('ol li')).toHaveLength(3);
    expect(element.textContent).toContain('iam.technicianRedirect.alternative');
  });

  it('replaces the QR code with a notice when the image cannot be loaded', async () => {
    element.querySelector(QR_CODE)?.dispatchEvent(new Event('error'));
    await render();

    expect(element.querySelector(QR_CODE)).toBeNull();
    expect(element.textContent).toContain('iam.technicianRedirect.qrUnavailable');
  });

  it('renders no owner navigation and no link back into the owner platform', () => {
    expect(element.querySelector('nav')).toBeNull();
    expect(element.querySelector('a')).toBeNull();
  });

  it('signs out and returns to sign in', async () => {
    const signOut = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('iam.actions.signOut'),
    );
    signOut?.click();
    await render();

    expect(store.signOut).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/iam/login');
  });
});
