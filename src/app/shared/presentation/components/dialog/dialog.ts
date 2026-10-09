import {
  afterNextRender,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '@shared/presentation/components/icon/icon';

let nextDialogId = 0;

/**
 * Modal dialog built on the native `<dialog>` element. It opens when rendered, keeps the rest of the page
 * inert, asks to close with Escape or its close button by emitting `closed`, and returns the focus to the
 * element that opened it when destroyed. Render it conditionally (`@if`) so its content starts fresh each
 * time; actions marked with `dialogActions` are projected into its footer.
 */
@Component({
  imports: [TranslatePipe, Icon],
  selector: 'app-dialog',
  styleUrl: './dialog.css',
  templateUrl: './dialog.html',
})
export class Dialog {
  /** The translated title of the dialog, which is also its accessible name. */
  readonly heading = input.required<string>();
  /** The translated description of the dialog, if any. */
  readonly description = input<string | null>(null);
  /** Emits when the user asks to close the dialog; the parent stops rendering it. */
  readonly closed = output<void>();

  protected readonly headingId = `app-dialog-heading-${nextDialogId}`;
  protected readonly descriptionId = `app-dialog-description-${nextDialogId++}`;

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private destroyed = false;

  constructor() {
    const opener = inject(DOCUMENT).activeElement;
    afterNextRender(() => this.dialog().nativeElement.showModal());
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      const dialog = this.dialog().nativeElement;
      if (dialog.open) {
        dialog.close();
      }
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }
    });
  }

  protected requestClose(event?: Event): void {
    // The parent decides when the dialog goes away, so Escape does not close it by itself.
    event?.preventDefault();
    if (!this.destroyed) {
      this.closed.emit();
    }
  }
}
