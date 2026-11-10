/**
 * ClientChannelResource is the client application a sign-in or refresh request comes from: `WEB`
 * admits only owner accounts and `MOBILE` only technician accounts.
 */
export type ClientChannelResource = 'WEB' | 'MOBILE';

/**
 * The channel of this application. Every session it opens is bound to it by the backend.
 */
export const WEB_CLIENT_CHANNEL: ClientChannelResource = 'WEB';
