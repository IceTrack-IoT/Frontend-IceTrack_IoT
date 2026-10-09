import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Returns the items of one page of a list.
 * @param items - The whole list.
 * @param page - The 1-based page number.
 * @param pageSize - The number of items per page.
 * @returns The items of the page.
 */
export function pageOf<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/**
 * Returns the number of pages needed to show a list, at least one.
 * @param total - The number of items of the list.
 * @param pageSize - The number of items per page.
 * @returns The number of pages.
 */
export function pageCountOf(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Page navigation of a paginated list. It renders nothing when the list fits in one page and emits the
 * page the user selects; the parent owns the current page.
 */
@Component({
  imports: [TranslatePipe, Icon],
  selector: 'app-pagination',
  styleUrl: './pagination.css',
  templateUrl: './pagination.html',
})
export class Pagination {
  /** The current 1-based page. */
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly pages = computed(() =>
    Array.from({ length: this.pageCount() }, (_, index) => index + 1),
  );

  protected select(page: number): void {
    if (page >= 1 && page <= this.pageCount() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}
