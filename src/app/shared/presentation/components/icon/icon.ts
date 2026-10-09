import { Component, computed, input } from '@angular/core';

const ICON_SPRITE_PATH = '/assets/icons/icons.svg';

/**
 * Symbols available in the icon sprite `public/assets/icons/icons.svg` (Tabler outline icons).
 * Add the symbol to the sprite before adding its name here.
 */
export type IconName =
  | 'activity'
  | 'alert-triangle'
  | 'arrow-left'
  | 'arrow-right'
  | 'bell'
  | 'bell-off'
  | 'bell-ringing'
  | 'bolt'
  | 'building-store'
  | 'calendar'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle-check'
  | 'circle-x'
  | 'clock'
  | 'copy'
  | 'cpu'
  | 'device-desktop-analytics'
  | 'device-mobile'
  | 'download'
  | 'eye'
  | 'eye-off'
  | 'file-text'
  | 'fridge'
  | 'gauge'
  | 'history'
  | 'info-circle'
  | 'key'
  | 'language'
  | 'link'
  | 'lock'
  | 'logout'
  | 'map-pin'
  | 'menu-2'
  | 'pencil'
  | 'phone'
  | 'plus'
  | 'qrcode'
  | 'refresh'
  | 'report-analytics'
  | 'search'
  | 'shield-check'
  | 'snowflake'
  | 'star'
  | 'star-filled'
  | 'temperature'
  | 'tools'
  | 'trash'
  | 'unlink'
  | 'user'
  | 'wifi'
  | 'wifi-off'
  | 'x';

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
