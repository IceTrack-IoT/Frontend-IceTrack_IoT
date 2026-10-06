import { BaseEntity } from '@shared/domain/model/base-entity';
import { Role } from '@iam/domain/value-objects/role';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';

/**
 * Represents a user entity with properties such as username, role, authentication provider, and external identifier.
 *
 * `externalId` are null when the source representation does not include them.
 */
export class User implements BaseEntity {
  private _id: number;
  private _username: string;
  private _role: Role;
  private _provider: AuthProvider;

  /**
   * Creates a new User instance.
   *
   * @param user - An object containing the user's properties.
   */
  constructor(user: {
    id: number;
    username: string;
    role: Role;
    provider: AuthProvider;
  }) {
    this._id = user.id;
    this._username = user.username;
    this._role = user.role;
    this._provider = user.provider;
  }
  get id(): number {
    return this._id;
  }
  set id(id: number) {
    this._id = id;
  }
  get username(): string {
    return this._username;
  }
  set username(username: string) {
    this._username = username;
  }
  get role(): Role {
    return this._role;
  }
  set role(role: Role) {
    this._role = role;
  }
  get provider(): AuthProvider {
    return this._provider;
  }
  set provider(provider: AuthProvider) {
    this._provider = provider;
  }
}
