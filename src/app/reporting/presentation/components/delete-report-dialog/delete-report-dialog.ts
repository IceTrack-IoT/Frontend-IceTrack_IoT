import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Asks the owner to confirm the deletion of a report. Deleting removes the report and its file for good,
 * and any download link issued before stops working.
 */
@Component({
  imports: [TranslatePipe, Dialog, Icon],
  selector: 'app-delete-report-dialog',
  templateUrl: './delete-report-dialog.html',
})
export class DeleteReportDialog {
  /** The name of the report to delete. */
  readonly reportName = input.required<string>();
  /** Whether the deletion is in progress. */
  readonly pending = input(false);
  /** The translation key of the failure of the last attempt, or null. */
  readonly errorKey = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly closed = output<void>();
}
