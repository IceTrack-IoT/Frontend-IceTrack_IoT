import { Injectable } from '@angular/core';
import type { TokenExpirationPort } from '@iam/application/ports/token-expiration.port';

/**
 * JwtTokenExpiration reads the `exp` claim of the platform JWT access token by decoding its payload.
 *
 * This is NOT a cryptographic verification: the HMAC signature is never checked on the client. The
 * result is only used for local UX and session decisions; the backend remains the authority.
 */
@Injectable({
  providedIn: 'root',
})
export class JwtTokenExpiration implements TokenExpirationPort {
  /**
   * @param accessToken - The platform access token.
   * @returns The `exp` claim as epoch milliseconds, or null when the token is not a decodable JWT or has
   *  no numeric `exp` claim.
   */
  readExpiresAt(accessToken: string): number | null {
    const segments = accessToken.split('.');
    if (segments.length !== 3) {
      return null;
    }
    const payload = this.decodeBase64UrlJson(segments[1]);
    if (typeof payload !== 'object' || payload === null || !('exp' in payload)) {
      return null;
    }
    const { exp } = payload;
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
  }

  /**
   * Decodes a Base64URL-encoded UTF-8 JSON segment using browser APIs only.
   */
  private decodeBase64UrlJson(segment: string): unknown {
    try {
      const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  }
}
