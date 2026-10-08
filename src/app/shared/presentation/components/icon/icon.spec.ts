import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';

describe('Icon', () => {
  function render(label?: string): HTMLElement {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'eye');
    if (label !== undefined) {
      fixture.componentRef.setInput('label', label);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('references the symbol of the sprite', () => {
    const element = render();

    expect(element.querySelector('use')?.getAttribute('href')).toBe('/assets/icons/icons.svg#eye');
  });

  it('is hidden from assistive technologies by default', () => {
    const svg = render().querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('role')).toBeNull();
    expect(svg?.getAttribute('aria-label')).toBeNull();
  });

  it('exposes a meaningful icon as an image with its label', () => {
    const svg = render('Show password').querySelector('svg');

    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Show password');
    expect(svg?.getAttribute('aria-hidden')).toBeNull();
  });
});
