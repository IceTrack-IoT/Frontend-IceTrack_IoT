/** The lifecycle status of a board, as the live feed reports it. */
export type DeviceFeedStatus = 'UNPAIRED' | 'PAIRED' | 'REVOKED';

/**
 * An event of the live device feed:
 * - `device-status`: a board was paired, had its key rotated or revoked, or was unpaired. A rotation keeps
 *   it `PAIRED`.
 * - `resync`: some changes may have been missed while the feed was down, so the inventory must be read
 *   again.
 */
export type DeviceFeedEvent =
  | {
      readonly kind: 'device-status';
      readonly deviceId: number;
      readonly status: DeviceFeedStatus;
    }
  | { readonly kind: 'resync' };
