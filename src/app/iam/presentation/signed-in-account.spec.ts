import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IamStore } from '@iam/application/iam-store';
import { User } from '@iam/domain/model/user.entity';
import { AuthProvider } from '@iam/domain/value-objects/auth-provider';
import { Role } from '@iam/domain/value-objects/role';
import { createSignedInAccount } from './signed-in-account';

describe('createSignedInAccount', () => {
  it('follows the user of the current session', () => {
    const currentUser = signal<User | null>(
      new User({ id: 7, username: 'mrojas', role: Role.OWNER_ROLE, provider: AuthProvider.GOOGLE }),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: IamStore, useValue: { currentUser } }],
    });

    const account = TestBed.runInInjectionContext(createSignedInAccount);

    expect(account()).toEqual({ id: 7, username: 'mrojas' });

    currentUser.set(null);
    expect(account()).toBeNull();
  });
});
