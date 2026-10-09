import { Component, input } from '@angular/core';
import { Icon, type IconName } from '@shared/presentation/components/icon/icon';

/** The visual tone of a status: its tint and text color. */
export type StatusTone = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

/** The tone and icon that represent a value of a status. */
export interface StatusAppearance {
  readonly tone: StatusTone;
  readonly icon: IconName;
}

/**
 * Pill that shows a status with its translated label, an icon and a tone, so the status is never conveyed
 * by color alone.
 */
@Component({
  imports: [Icon],
  selector: 'app-status-tag',
  templateUrl: './status-tag.html',
})
export class StatusTag {
  /** The translated label of the status. */
  readonly label = input.required<string>();
  readonly appearance = input.required<StatusAppearance>();
}
