import { BaseEntity } from '@shared/domain/model/base-entity';
import { Role } from '@iam/domain/value-objects/role';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';

/**
 * Represents a user entity with properties such as username, role, authentication provider, external identifier, and email.
 *
 * `provider`, `externalId`, and `email` are null when the source representation does not include them.
 */
export class User implements BaseEntity {
  private _id: number;
  private _username: string;
  private _role: Role;
  private _provider: AuthProvider | null;
  private _externalId: string | null;
  private _email: string | null;

  /**
   * Creates a new User instance.
   *
   * @param user - An object containing the user's properties.
   */
  constructor(user: {
    id: number;
    username: string;
    role: Role;
    provider: AuthProvider | null;
    externalId: string | null;
    email: string | null;
  }) {
    this._id = user.id;
    this._username = user.username;
    this._role = user.role;
    this._provider = user.provider;
    this._externalId = user.externalId;
    this._email = user.email;
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
  get provider(): AuthProvider | null {
    return this._provider;
  }
  set provider(provider: AuthProvider | null) {
    this._provider = provider;
  }
  get externalId(): string | null {
    return this._externalId;
  }
  set externalId(externalId: string | null) {
    this._externalId = externalId;
  }
  get email(): string | null {
    return this._email;
  }
  set email(email: string | null) {
    this._email = email;
  }

}
