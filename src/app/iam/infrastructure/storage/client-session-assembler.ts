import type { ClientSession } from '@iam/application/state/client-session';
import { User } from '@iam/domain/model/user.entity';
import {
  CLIENT_SESSION_RESOURCE_VERSION,
  type ClientSessionResource,
} from '@iam/infrastructure/storage/client-session.resource';
import { isAuthProvider } from '@iam/domain/value-objects/auth-provider';

/**
 * ClientSessionAssembler is responsible for converting between client sessions and their persisted resources.
 */
export class ClientSessionAssembler {
  /**
   * Converts a ClientSessionResource to a ClientSession.
   * @param resource The ClientSessionResource to convert.
   * @returns The corresponding ClientSession.
   */
  toClientSessionFromResource(resource: ClientSessionResource): ClientSession {
    return {
      user: new User({
        id: resource.user.id,
        username: resource.user.username,
        role: resource.user.role,
        provider: resource.user.provider,
      }),
      accessToken: resource.token,
      refreshToken: resource.refresh_token,
      accessTokenExpiresAt: resource.token_expires_at,
    };
  }

  /**
   * Converts a ClientSession to a ClientSessionResource.
   * @param session The ClientSession to convert.
   * @returns The corresponding ClientSessionResource.
   */
  toResourceFromClientSession(session: ClientSession): ClientSessionResource {
    return {
      version: CLIENT_SESSION_RESOURCE_VERSION,
      token: session.accessToken,
      refresh_token: session.refreshToken,
      token_expires_at: session.accessTokenExpiresAt,
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
        provider: session.user.provider,
      },
    };
  }
}
