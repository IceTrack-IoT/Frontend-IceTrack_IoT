/**
 * A signal of one named event of the owner event stream, relayed to the bounded context that owns that
 * event without being interpreted:
 * - `event`: the event arrived; `data` is its untrusted JSON payload, for the owning context to parse.
 * - `gap`: the stream (re)connected and could not replay every event missed meanwhile.
 * - `interrupted`: the stream is down and reconnecting; no event arrives meanwhile.
 * - `restored`: the stream reconnected and replayed every event missed meanwhile.
 *
 * The relayed feed completes when the stream can never be opened in this session.
 */
export type OwnerStreamSignal =
  | { readonly kind: 'event'; readonly data: unknown }
  | { readonly kind: 'gap' }
  | { readonly kind: 'interrupted' }
  | { readonly kind: 'restored' };
