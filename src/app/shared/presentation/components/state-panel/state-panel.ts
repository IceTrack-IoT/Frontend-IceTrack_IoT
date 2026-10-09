import { Component, computed, input } from '@angular/core';
import { Icon, type IconName } from '@shared/presentation/components/icon/icon';

/** The asynchronous states of a data section that are not its populated content. */
export type StatePanelKind = 'loading' | 'empty' | 'error';

const STATE_ICONS: Readonly<Record<Exclude<StatePanelKind, 'loading'>, IconName>> = {
  empty: 'search',
  error: 'alert-triangle',
};

/**
 * Renders the loading, empty or error state of a data section with a translated heading and message.
 * Errors are announced as alerts and the other states as status messages. Actions, such as a retry
 * button, are projected below the message.
 */
@Component({
  imports: [Icon],
  selector: 'app-state-panel',
  styleUrl: './state-panel.css',
  templateUrl: './state-panel.html',
})
export class StatePanel {
  readonly kind = input.required<StatePanelKind>();
  /** The translated heading of the state. */
  readonly heading = input.required<string>();
  /** The translated explanation of the state, if any. */
  readonly message = input<string | null>(null);

  protected readonly icon = computed(() => {
    const kind = this.kind();
    return kind === 'loading' ? null : STATE_ICONS[kind];
  });
}
