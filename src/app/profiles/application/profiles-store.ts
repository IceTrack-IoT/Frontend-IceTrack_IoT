import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, type Observable } from 'rxjs';
import type { OwnerProfile } from '@profiles/domain/model/owner-profile.entity';
import type { TechnicianProfile } from '@profiles/domain/model/technician-profile.entity';
import { LoadOwnerProfileByUserIdUseCase } from '@profiles/application/use-cases/load-owner-profile-by-user-id.use-case';
import { LoadOwnerProfilesUseCase } from '@profiles/application/use-cases/load-owner-profiles.use-case';
import { LoadTechnicianProfilesUseCase } from '@profiles/application/use-cases/load-technician-profiles.use-case';
import { UpdateOwnerProfileUseCase } from '@profiles/application/use-cases/update-owner-profile.use-case';

/**
 * Profiles Store is a service that manages the state of owner and technician profiles in the application.
 * It holds signal-based state only and delegates profile operations to Profiles use cases.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfilesStore {
  private readonly loadOwnerProfilesUseCase = inject(LoadOwnerProfilesUseCase);
  private readonly loadOwnerProfileByUserIdUseCase = inject(LoadOwnerProfileByUserIdUseCase);
  private readonly updateOwnerProfileUseCase = inject(UpdateOwnerProfileUseCase);
  private readonly loadTechnicianProfilesUseCase = inject(LoadTechnicianProfilesUseCase);

  private readonly ownerProfilesSignal = signal<OwnerProfile[]>([]);
  readonly ownerProfiles = this.ownerProfilesSignal.asReadonly();

  private readonly currentOwnerProfileSignal = signal<OwnerProfile | null>(null);
  /**
   * The owner profile last loaded by platform account, usually the one of the signed-in account, or null
   * while none is loaded.
   */
  readonly currentOwnerProfile = this.currentOwnerProfileSignal.asReadonly();

  private readonly technicianProfilesSignal = signal<TechnicianProfile[]>([]);
  readonly technicianProfiles = this.technicianProfilesSignal.asReadonly();

  private readonly pendingOperationsSignal = signal<number>(0);
  /**
   * True while at least one profile operation is in progress.
   */
  readonly loading = computed(() => this.pendingOperationsSignal() > 0);

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  /**
   * Loads the owner profiles from the backend, replacing the ones in memory.
   */
  loadOwnerProfiles(): void {
    this.run(
      this.loadOwnerProfilesUseCase.execute(),
      (profiles) => this.ownerProfilesSignal.set(profiles),
      'Failed to load the owner profiles',
    );
  }

  /**
   * Loads the owner profile bound to a platform account. A profile of another account is discarded first,
   * so it is never shown as the one of this account.
   * @param userId - The identifier of the platform account.
   */
  loadOwnerProfileByUserId(userId: number): void {
    if (this.currentOwnerProfileSignal()?.user_id !== userId) {
      this.currentOwnerProfileSignal.set(null);
    }
    this.run(
      this.loadOwnerProfileByUserIdUseCase.execute(userId),
      (profile) => this.currentOwnerProfileSignal.set(profile),
      'Failed to load the owner profile',
    );
  }

  /**
   * Updates an owner profile on the backend and replaces it in memory, in the loaded owner profiles and as
   * the current owner profile, with the stored version.
   * @param profile - The owner profile with its new data.
   */
  updateOwnerProfile(profile: OwnerProfile): void {
    this.run(
      this.updateOwnerProfileUseCase.execute(profile),
      (updated) => {
        this.ownerProfilesSignal.update((profiles) =>
          profiles.map((current) => (current.id === updated.id ? updated : current)),
        );
        if (this.currentOwnerProfileSignal()?.id === updated.id) {
          this.currentOwnerProfileSignal.set(updated);
        }
      },
      'Failed to update the owner profile',
    );
  }

  /**
   * Loads the technician profiles from the backend, replacing the ones in memory.
   */
  loadTechnicianProfiles(): void {
    this.run(
      this.loadTechnicianProfilesUseCase.execute(),
      (profiles) => this.technicianProfilesSignal.set(profiles),
      'Failed to load the technician profiles',
    );
  }

  /**
   * Runs a profile operation: tracks it as pending, clears the previous error and applies its result,
   * or keeps the current state and reports the error when it fails.
   * @param operation - The operation to run.
   * @param apply - Applies the result of the operation to the state.
   * @param fallbackError - The error message used when the failure has no message.
   */
  private run<T>(
    operation: Observable<T>,
    apply: (result: T) => void,
    fallbackError: string,
  ): void {
    this.pendingOperationsSignal.update((count) => count + 1);
    this.errorSignal.set(null);
    operation
      .pipe(finalize(() => this.pendingOperationsSignal.update((count) => count - 1)))
      .subscribe({
        next: apply,
        error: (error: unknown) => this.errorSignal.set(this.formatError(error, fallbackError)),
      });
  }

  /**
   * Formats error messages for user-friendly display.
   * @param error - The error object.
   * @param fallback - The fallback error message.
   * @returns A formatted error message.
   */
  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
