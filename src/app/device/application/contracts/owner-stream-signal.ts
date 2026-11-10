/**
 * A signal of one named event of the owner event stream, as Monitoring and Alerting relays it:
 * - `event`: the event arrived; `data` is its untrusted JSON payload, parsed by this context's adapter.
 * - `gap`: the stream reconnected and could not replay every event missed meanwhile.
 * - `interrupted`: the stream dropped and is reconnecting; no event arrives meanwhile.
 * - `restored`: the stream reconnected and replayed every event missed meanwhile.
 */
export type OwnerStreamSignal =
  | { readonly kind: 'event'; readonly data: unknown }
  | { readonly kind: 'gap' }
  | { readonly kind: 'interrupted' }
  | { readonly kind: 'restored' };
