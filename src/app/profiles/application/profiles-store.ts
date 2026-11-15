import { type DestroyRef, inject, Injectable, signal, type WritableSignal } from '@angular/core';
import { finalize, Observable, Subscription } from 'rxjs';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import type { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import type { TechnicianPublicProfile } from '@profiles/domain/model/technician-public-profile.entity';
import type { OwnerProfileUpdate } from '@profiles/application/contracts/owner-profile-update';
import {
  type ProfilesFailure,
  toProfilesFailure,
} from '@profiles/application/contracts/profiles-error';
import { LoadOwnerProfileByUserIdUseCase } from '@profiles/application/use-cases/load-owner-profile-by-user-id.use-case';
import { LoadTechnicianProfilesUseCase } from '@profiles/application/use-cases/load-technician-profiles.use-case';
import { LoadTechnicianPublicProfileUseCase } from '@profiles/application/use-cases/load-technician-public-profile.use-case';
import { UpdateOwnerProfileUseCase } from '@profiles/application/use-cases/update-owner-profile.use-case';

/**
 * Profiles Store manages the signed-in owner's profile and the technician profiles that owners consult
 * read-only. It holds signal-based state only and delegates profile operations to Profiles use cases. The
 * loaded state is kept for the owner session the views retain it for; once that session ends, every
 * operation in progress stops and everything is discarded.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfilesStore {
  private readonly loadOwnerProfileByUserIdUseCase = inject(LoadOwnerProfileByUserIdUseCase);
  private readonly updateOwnerProfileUseCase = inject(UpdateOwnerProfileUseCase);
  private readonly loadTechnicianProfilesUseCase = inject(LoadTechnicianProfilesUseCase);
  private readonly loadTechnicianPublicProfileUseCase = inject(LoadTechnicianPublicProfileUseCase);

  private readonly ownerProfileSignal = signal<OwnerProfile | null>(null);
  /** The owner profile last loaded by platform account, or null while none is loaded. */
  readonly ownerProfile = this.ownerProfileSignal.asReadonly();
  private readonly ownerProfileLoadingSignal = signal(false);
  readonly ownerProfileLoading = this.ownerProfileLoadingSignal.asReadonly();
  private readonly ownerProfileFailureSignal = signal<ProfilesFailure | null>(null);
  /** Why the owner profile could not be loaded; `OWNER_NOT_FOUND` when the account has none. */
  readonly ownerProfileFailure = this.ownerProfileFailureSignal.asReadonly();

  private readonly ownerProfileSavingSignal = signal(false);
  readonly ownerProfileSaving = this.ownerProfileSavingSignal.asReadonly();
  private readonly ownerProfileSaveFailureSignal = signal<ProfilesFailure | null>(null);
  readonly ownerProfileSaveFailure = this.ownerProfileSaveFailureSignal.asReadonly();
  private readonly ownerProfileSavedSignal = signal(false);
  /** True once the last owner profile update succeeded, until the save feedback is cleared. */
  readonly ownerProfileSaved = this.ownerProfileSavedSignal.asReadonly();

  private readonly technicianProfilesSignal = signal<TechnicianProfile[]>([]);
  /** The technician directory, read-only. */
  readonly technicianProfiles = this.technicianProfilesSignal.asReadonly();
  private readonly technicianProfilesLoadingSignal = signal(false);
  readonly technicianProfilesLoading = this.technicianProfilesLoadingSignal.asReadonly();
  private readonly technicianProfilesFailureSignal = signal<ProfilesFailure | null>(null);
  readonly technicianProfilesFailure = this.technicianProfilesFailureSignal.asReadonly();

  private readonly technicianPublicProfileSignal = signal<TechnicianPublicProfile | null>(null);
  /** The public profile last loaded, read-only, or null while none is loaded. */
  readonly technicianPublicProfile = this.technicianPublicProfileSignal.asReadonly();
  private readonly technicianPublicProfileLoadingSignal = signal(false);
  readonly technicianPublicProfileLoading = this.technicianPublicProfileLoadingSignal.asReadonly();
  private readonly technicianPublicProfileFailureSignal = signal<ProfilesFailure | null>(null);
  /** Why the public profile could not be loaded; `TECHNICIAN_NOT_FOUND` for an unknown technician. */
  readonly technicianPublicProfileFailure = this.technicianPublicProfileFailureSignal.asReadonly();

  /** Every read and write of the session in progress, stopped when the session ends. */
  private sessionWork = new Subscription();
  private retainedSession: DestroyRef | null = null;

  /**
   * Keeps the loaded state until the owner session ends; then every operation in progress stops and the
   * state is discarded, so nothing reaches the next session.
   * @param session - The lifetime of the owner session.
   */
  retain(session: DestroyRef): void {
    if (this.retainedSession === session) {
      return;
    }
    this.retainedSession = session;
    session.onDestroy(() => {
      if (this.retainedSession === session) {
        this.retainedSession = null;
        this.release();
      }
    });
  }

  /**
   * Loads the owner profile bound to a platform account. A profile of another account is discarded first,
   * so it is never shown as the one of this account.
   * @param userId - The identifier of the platform account.
   */
  loadOwnerProfile(userId: number): void {
    if (this.ownerProfileSignal()?.user_id !== userId) {
      this.ownerProfileSignal.set(null);
    }
    this.run(
      this.loadOwnerProfileByUserIdUseCase.execute(userId),
      this.ownerProfileLoadingSignal,
      this.ownerProfileFailureSignal,
      (profile) => this.ownerProfileSignal.set(profile),
    );
  }

  /**
   * Replaces the data of the loaded owner profile on the backend and keeps the stored version. When the
   * profile changed since it was loaded (`CONCURRENT_MODIFICATION_CONFLICT`), nothing is saved and the
   * current profile is loaded again, so the owner can review it and save once more.
   * @param update - The new profile data, with the complete address.
   */
  updateOwnerProfile(update: OwnerProfileUpdate): void {
    const profile = this.ownerProfileSignal();
    if (profile === null || this.ownerProfileSavingSignal()) {
      return;
    }
    this.ownerProfileSavedSignal.set(false);
    this.ownerProfileSavingSignal.set(true);
    this.ownerProfileSaveFailureSignal.set(null);
    this.track(
      this.updateOwnerProfileUseCase
        .execute(profile, update)
        .pipe(finalize(() => this.ownerProfileSavingSignal.set(false))),
    ).subscribe({
      next: (updated) => {
        this.ownerProfileSignal.set(updated);
        this.ownerProfileSavedSignal.set(true);
      },
      error: (error: unknown) => {
        const failure = toProfilesFailure(error);
        this.ownerProfileSaveFailureSignal.set(failure);
        if (failure === 'CONCURRENT_MODIFICATION_CONFLICT') {
          this.loadOwnerProfile(profile.user_id);
        }
      },
    });
  }

  /**
   * Clears the outcome of the last owner profile update.
   */
  clearOwnerProfileSaveFeedback(): void {
    this.ownerProfileSaveFailureSignal.set(null);
    this.ownerProfileSavedSignal.set(false);
  }

  /**
   * Loads the technician directory from the backend, replacing the one in memory.
   */
  loadTechnicianProfiles(): void {
    this.run(
      this.loadTechnicianProfilesUseCase.execute(),
      this.technicianProfilesLoadingSignal,
      this.technicianProfilesFailureSignal,
      (profiles) => this.technicianProfilesSignal.set(profiles),
    );
  }

  /**
   * Loads the public profile of a technician. A profile of another technician is discarded first.
   * @param technicianId - The identifier of the technician profile.
   */
  loadTechnicianPublicProfile(technicianId: number): void {
    if (this.technicianPublicProfileSignal()?.id !== technicianId) {
      this.technicianPublicProfileSignal.set(null);
    }
    this.run(
      this.loadTechnicianPublicProfileUseCase.execute(technicianId),
      this.technicianPublicProfileLoadingSignal,
      this.technicianPublicProfileFailureSignal,
      (profile) => this.technicianPublicProfileSignal.set(profile),
    );
  }

  /**
   * Runs a profile operation: tracks it as in progress, clears its previous failure and applies its
   * result, or keeps the current state and records the failure.
   */
  private run<T>(
    operation: Observable<T>,
    inProgress: WritableSignal<boolean>,
    failure: WritableSignal<ProfilesFailure | null>,
    apply: (result: T) => void,
  ): void {
    inProgress.set(true);
    failure.set(null);
    this.track(operation.pipe(finalize(() => inProgress.set(false)))).subscribe({
      next: apply,
      error: (error: unknown) => failure.set(toProfilesFailure(error)),
    });
  }

  /** Runs an operation within the session, so it stops when the session ends. */
  private track<T>(operation: Observable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      const subscription = operation.subscribe(subscriber);
      this.sessionWork.add(subscription);
      return () => {
        subscription.unsubscribe();
        this.sessionWork.remove(subscription);
      };
    });
  }

  /** Stops every operation in progress and discards every loaded value once the session ends. */
  private release(): void {
    this.sessionWork.unsubscribe();
    this.sessionWork = new Subscription();
    this.ownerProfileSignal.set(null);
    this.ownerProfileLoadingSignal.set(false);
    this.ownerProfileFailureSignal.set(null);
    this.ownerProfileSavingSignal.set(false);
    this.ownerProfileSaveFailureSignal.set(null);
    this.ownerProfileSavedSignal.set(false);
    this.technicianProfilesSignal.set([]);
    this.technicianProfilesLoadingSignal.set(false);
    this.technicianProfilesFailureSignal.set(null);
    this.technicianPublicProfileSignal.set(null);
    this.technicianPublicProfileLoadingSignal.set(false);
    this.technicianPublicProfileFailureSignal.set(null);
  }
}
