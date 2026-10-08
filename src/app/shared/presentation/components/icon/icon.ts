import { Component, computed, input } from '@angular/core';

const ICON_SPRITE_PATH = '/assets/icons/icons.svg';

/**
 * Symbols available in the icon sprite `public/assets/icons/icons.svg` (Tabler outline icons).
 * Add the symbol to the sprite before adding its name here.
 */
export type IconName =
  | 'arrow-right'
  | 'bell'
  | 'bell-ringing'
  | 'bolt'
  | 'building-store'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle-check'
  | 'clock'
  | 'cpu'
  | 'device-desktop-analytics'
  | 'device-mobile'
  | 'download'
  | 'eye'
  | 'eye-off'
  | 'gauge'
  | 'history'
  | 'lock'
  | 'qrcode'
  | 'report-analytics'
  | 'shield-check'
  | 'snowflake'
  | 'temperature'
  | 'tools'
  | 'user'
  | 'wifi';

/**
 * Renders an icon of the sprite in the current text color, sized 1em unless the host is sized by the
 * parent. Icons are decorative (hidden from assistive technologies) unless a translated `label` is given.
 */
@Component({
  selector: 'app-icon',
  styleUrl: './icon.css',
  templateUrl: './icon.html',
})
export class Icon {
  readonly name = input.required<IconName>();
  /** The translated accessible name of a meaningful icon. Omit it for decorative icons. */
  readonly label = input<string | null>(null);

  protected readonly href = computed(() => `${ICON_SPRITE_PATH}#${this.name()}`);
}
