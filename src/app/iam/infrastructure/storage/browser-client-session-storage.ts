import { DOCUMENT, inject, Injectable } from '@angular/core';
import type { SessionStoragePort } from '@iam/application/ports/session-storage.port';
import type { ClientSession } from '@iam/application/state/client-session';
import { BrowserStorageKeys } from '@iam/infrastructure/storage/browser-storage-keys';
import { ClientSessionAssembler } from '@iam/infrastructure/storage/client-session-assembler';
import { isClientSessionResource } from '@iam/infrastructure/storage/client-session.resource';

/**
 * BrowserClientSessionStorage persists the client session as one canonical resource in `localStorage`.
 *
 * SECURITY LIMITATION: the backend contract requires the refresh token in the JSON body of refresh and
 * logout requests, so it must be readable by JavaScript. It is persisted in `localStorage` (shared by
 * all tabs) so that page reloads and multi-tab token rotation work. This exposes the refresh and access
 * tokens to any script running on this origin and increases the impact of XSS. A future backend
 * migration should transport the refresh token in an HttpOnly, Secure, SameSite cookie instead.
 * The Google ID token is never persisted.
 */
@Injectable({
  providedIn: 'root',
})
export class BrowserClientSessionStorage implements SessionStoragePort {
  private readonly document = inject(DOCUMENT);
  private readonly assembler = new ClientSessionAssembler();

  load(): ClientSession | null {
    const serialized = this.read();
    if (serialized === null) {
      return null;
    }
    const parsed = this.parse(serialized);
    if (!isClientSessionResource(parsed)) {
      this.clear();
      return null;
    }
    return this.assembler.toClientSessionFromResource(parsed);
  }

  /**
   * Replaces the persisted session atomically with a single write of the whole resource.
   */
  save(session: ClientSession): void {
    const resource = this.assembler.toResourceFromClientSession(session);
    try {
      this.storage()?.setItem(BrowserStorageKeys.clientSession, JSON.stringify(resource));
    } catch {
      // Storage is full or blocked: the session is kept in memory only.
    }
  }

  clear(): void {
    try {
      this.storage()?.removeItem(BrowserStorageKeys.clientSession);
    } catch {
      // Storage is blocked: nothing can have been persisted.
    }
  }

  private read(): string | null {
    try {
      return this.storage()?.getItem(BrowserStorageKeys.clientSession) ?? null;
    } catch {
      return null;
    }
  }

  private parse(serialized: string): unknown {
    try {
      return JSON.parse(serialized);
    } catch {
      return null;
    }
  }

  /**
   * Resolves `localStorage` safely: it is absent outside a browser, and accessing it throws when the
   * browser blocks storage.
   */
  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
