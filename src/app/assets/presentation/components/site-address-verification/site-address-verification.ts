import { Component, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  catchError,
  debounceTime,
  from,
  map,
  of,
  switchMap,
  tap,
  type Observable,
} from 'rxjs';
import type { PlaceSuggestion } from '@assets/application/contracts/place-suggestion';
import { SITE_ADDRESS_MAX_LENGTH } from '@assets/application/contracts/site-registration';
import {
  PLACE_QUERY_MIN_LENGTH,
  PlaceSuggestionsPort,
} from '@assets/application/ports/place-suggestions.port';
import type { AddressVerificationState } from '@assets/application/assets-store';
import { addressVerificationErrorKey } from '@assets/presentation/assets-feedback';
import { SiteMap } from '@assets/presentation/components/site-map/site-map';
import { Icon } from '@shared/presentation/components/icon/icon';
import { activeLanguage } from '@shared/presentation/pipes/active-language';

/** How long the field waits after a keystroke before asking for place suggestions. */
const SUGGESTION_DEBOUNCE_MS = 250;

/**
 * Where the place lookup of the field stands: `idle` shows no panel, `searching` waits for the provider
 * (keeping the previous suggestions visible so the panel does not flicker), and `settled` shows what the
 * provider answered, which may be nothing.
 */
type LookupStatus = 'idle' | 'searching' | 'settled';

let nextVerificationId = 0;

/**
 * Address field of a site that the backend verifies before the site is saved. The owner types an address
 * and asks to verify it; the verified, normalized address replaces the field, and an address that was not
 * verified offers the suggested candidates. While typing, the field also offers the places the map
 * provider suggests, which only fill the field. Verifying saves nothing.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Icon, SiteMap],
  selector: 'app-site-address-verification',
  styleUrl: './site-address-verification.css',
  templateUrl: './site-address-verification.html',
})
export class SiteAddressVerification {
  /** The state of the verification, owned by the parent. */
  readonly verification = input.required<AddressVerificationState>();
  /** Whether to tell the owner that a verified address is still missing. */
  readonly showMissing = input(false);
  /** Whether the form this field belongs to is being saved. */
  readonly disabled = input(false);
  /** Emits the address the owner asks to verify. */
  readonly verify = output<string>();
  /** Emits when the owner discards the verified address to type another one. */
  readonly reset = output<void>();

  private readonly places = inject(PlaceSuggestionsPort);
  private readonly translate = inject(TranslateService);

  protected readonly id = `site-address-${nextVerificationId++}`;
  protected readonly suggestionsId = `${this.id}-suggestions`;
  protected readonly maxLength = SITE_ADDRESS_MAX_LENGTH;
  protected readonly address = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(SITE_ADDRESS_MAX_LENGTH)],
  });

  protected readonly suggestions = signal<readonly PlaceSuggestion[]>([]);
  protected readonly lookupStatus = signal<LookupStatus>('idle');
  protected readonly activeIndex = signal(-1);
  /** Whether the listbox has options the owner can move through and pick. */
  protected readonly open = computed(() => this.suggestions().length > 0);
  protected readonly searching = computed(() => this.lookupStatus() === 'searching');
  /** Whether the panel below the field shows suggestions, a search in progress, or no matches. */
  protected readonly panelOpen = computed(() => this.lookupStatus() !== 'idle');
  protected readonly noMatches = computed(
    () => this.lookupStatus() === 'settled' && this.suggestions().length === 0,
  );
  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return this.open() && index >= 0 ? `${this.suggestionsId}-${index}` : null;
  });

  protected readonly verifying = computed(() => this.verification().status === 'verifying');
  protected readonly failureKey = computed(() => {
    const failure = this.verification().failure;
    return failure === null ? null : addressVerificationErrorKey(failure);
  });

  constructor() {
    this.address.valueChanges
      .pipe(
        tap((query) => this.startLookup(query)),
        debounceTime(SUGGESTION_DEBOUNCE_MS),
        switchMap((query) => this.lookup(query)),
        takeUntilDestroyed(),
      )
      .subscribe((suggestions) => this.settleLookup(suggestions));
  }

  protected submit(): void {
    if (this.verifying() || this.disabled()) {
      return;
    }
    if (this.address.invalid) {
      this.address.markAsTouched();
      return;
    }
    this.closeSuggestions();
    this.verify.emit(this.address.value);
  }

  protected pickCandidate(candidate: string): void {
    this.address.setValue(candidate, { emitEvent: false });
    this.closeSuggestions();
    this.submit();
  }

  protected pickSuggestion(suggestion: PlaceSuggestion): void {
    this.address.setValue(suggestion.address, { emitEvent: false });
    this.closeSuggestions();
    this.places.completeSelection();
    this.submit();
  }

  /** Discards the verified address and the place session that led to it. */
  protected restart(): void {
    this.closeSuggestions();
    this.places.completeSelection();
    this.reset.emit();
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        if (this.open()) {
          event.preventDefault();
          this.move(1);
        }
        return;
      case 'ArrowUp':
        if (this.open()) {
          event.preventDefault();
          this.move(-1);
        }
        return;
      case 'Escape':
        if (this.panelOpen()) {
          this.closeSuggestions();
        }
        return;
      case 'Enter': {
        event.preventDefault();
        const suggestion = this.open() ? this.suggestions()[this.activeIndex()] : undefined;
        if (suggestion === undefined) {
          this.submit();
        } else {
          this.pickSuggestion(suggestion);
        }
        return;
      }
      default:
        return;
    }
  }

  protected onInputBlur(): void {
    this.closeSuggestions();
  }

  protected fieldErrorKey(): string | null {
    if (this.address.touched && this.address.hasError('required')) {
      return 'shared.validation.required';
    }
    if (this.address.hasError('maxlength')) {
      return 'shared.validation.tooLong';
    }
    return this.showMissing() && this.verification().status !== 'verifying'
      ? 'assets.addressVerification.required'
      : null;
  }

  /** Whether a query is worth asking the provider for places. */
  private canLookup(query: string): boolean {
    return !this.disabled() && !this.verifying() && query.trim().length >= PLACE_QUERY_MIN_LENGTH;
  }

  /**
   * Shows the search as soon as the owner types, before the debounce elapses, so the field never looks
   * idle while places are on their way. The previous suggestions stay until the new ones arrive.
   */
  private startLookup(query: string): void {
    if (!this.canLookup(query)) {
      this.closeSuggestions();
      return;
    }
    this.activeIndex.set(-1);
    this.lookupStatus.set('searching');
  }

  /**
   * Shows the places the provider answered, unless the owner closed the panel meanwhile. A provider
   * failure (`null`) closes the panel instead of claiming there are no matches.
   */
  private settleLookup(suggestions: readonly PlaceSuggestion[] | null): void {
    if (this.lookupStatus() !== 'searching') {
      return;
    }
    if (suggestions === null) {
      this.closeSuggestions();
      return;
    }
    this.suggestions.set(suggestions);
    this.activeIndex.set(-1);
    this.lookupStatus.set('settled');
  }

  /** Asks the provider for places; emits `null` when the provider fails. */
  private lookup(query: string): Observable<readonly PlaceSuggestion[] | null> {
    if (!this.canLookup(query)) {
      return of([]);
    }

    return from(this.places.suggest(query, activeLanguage(this.translate))).pipe(
      map((suggestions): readonly PlaceSuggestion[] | null => suggestions),
      catchError(() => of(null)),
    );
  }

  private move(delta: number): void {
    const total = this.suggestions().length;
    const current = this.activeIndex();
    this.activeIndex.set(
      delta > 0 ? (current + 1) % total : current <= 0 ? total - 1 : current - 1,
    );
  }

  private closeSuggestions(): void {
    this.suggestions.set([]);
    this.activeIndex.set(-1);
    this.lookupStatus.set('idle');
  }
}
