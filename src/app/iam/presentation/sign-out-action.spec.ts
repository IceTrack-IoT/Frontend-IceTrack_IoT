import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { IamStore } from '@iam/application/iam-store';
import { createSignOutAction } from './sign-out-action';

describe('createSignOutAction', () => {
  it('ends the session and returns to sign-in', () => {
    const store = { signOut: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: IamStore, useValue: store }],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const signOut = TestBed.runInInjectionContext(createSignOutAction);
    signOut();

    expect(store.signOut).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/iam/login');
  });
});
