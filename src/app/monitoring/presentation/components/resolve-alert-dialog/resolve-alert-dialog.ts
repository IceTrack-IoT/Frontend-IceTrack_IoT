import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Confirmation to resolve an alert once its condition has been corrected. Resolving closes the alert and
 * records who resolved it, so it is not done with a single click. The dialog stays open while the
 * resolution is in progress and when it fails.
 */
@Component({
  imports: [TranslatePipe, Dialog, Icon],
  selector: 'app-resolve-alert-dialog',
  templateUrl: './resolve-alert-dialog.html',
})
export class ResolveAlertDialog {
  /** The translated description of the alert being resolved. */
  readonly alertLabel = input.required<string>();
  /** Whether the resolution is in progress. */
  readonly pending = input(false);
  /** The translation key of why the last resolution failed, if it did. */
  readonly errorKey = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();
}
