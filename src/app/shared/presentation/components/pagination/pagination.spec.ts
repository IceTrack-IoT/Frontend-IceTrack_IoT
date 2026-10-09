import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { pageCountOf, pageOf, Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;
  let element: HTMLElement;

  async function render(page: number, pageCount: number): Promise<void> {
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageCount', pageCount);
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Pagination);
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders nothing when the list fits in one page', async () => {
    await render(1, 1);

    expect(element.querySelector('nav')).toBeNull();
  });

  it('marks the current page and disables moving before the first page', async () => {
    await render(1, 3);

    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'shared.pagination.label',
    );
    expect(element.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('1');
    const [previous] = Array.from(element.querySelectorAll<HTMLButtonElement>('nav > button'));
    expect(previous.disabled).toBe(true);
  });

  it('emits the page the user selects', async () => {
    const pages: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => pages.push(page));
    await render(2, 3);

    element.querySelectorAll<HTMLButtonElement>('.pagination__page')[2].click();
    element.querySelectorAll<HTMLButtonElement>('nav > button')[1].click();

    expect(pages).toEqual([3, 3]);
  });

  it('slices a list into pages', () => {
    expect(pageOf([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(pageCountOf(5, 2)).toBe(3);
    expect(pageCountOf(0, 2)).toBe(1);
  });
});
