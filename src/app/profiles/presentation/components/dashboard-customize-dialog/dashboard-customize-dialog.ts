import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardConfig } from '@profiles/domain/model/dashboard-config.entity';
import type { DashboardCard } from '@profiles/domain/value-objects/dashboard-card';
import type { TemperatureRange } from '@profiles/domain/value-objects/temperature-range';
import { CARD_TYPE_ICONS } from '@profiles/presentation/dashboard-appearance';
import {
  type DashboardSite,
  DEFAULT_CARD_ORDER,
} from '@profiles/presentation/mocks/dashboard.mock';
import { Dialog } from '@shared/presentation/components/dialog/dialog';
import { Icon } from '@shared/presentation/components/icon/icon';

const LABEL_MAX_LENGTH = 40;

/** The minimum temperature must be strictly lower than the maximum temperature. */
const minBelowMax: ValidatorFn = (group) => {
  const min: unknown = group.get('min')?.value;
  const max: unknown = group.get('max')?.value;
  return typeof min === 'number' && typeof max === 'number' && min >= max
    ? { minNotBelowMax: true }
    : null;
};

/** The dashboard layout and defaults chosen by the owner. */
export interface DashboardLayoutChange {
  /** Every card, in display order, with its position and visibility. */
  readonly cards: DashboardCard[];
  readonly defaultSiteId: number;
  readonly defaultTemperatureRange: TemperatureRange;
}

/** A pending announcement for assistive technologies: a translation key and its parameters. */
interface Announcement {
  readonly key: string;
  readonly params: Record<string, string | number>;
}

type DefaultsControl = 'siteId' | 'min' | 'max' | 'label';

/**
 * Lets the owner choose which dashboard cards are visible and in which order, and the defaults of the
 * dashboard: the site it opens on and the reference temperature range. Cards move with buttons rather
 * than dragging, so the order can be changed with the keyboard; the focus follows the moved card.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog, Icon],
  selector: 'app-dashboard-customize-dialog',
  styleUrl: './dashboard-customize-dialog.css',
  templateUrl: './dashboard-customize-dialog.html',
})
export class DashboardCustomizeDialog implements OnInit {
  readonly config = input.required<DashboardConfig>();
  readonly sites = input.required<readonly DashboardSite[]>();
  /** Whether the save is in progress. */
  readonly pending = input(false);
  readonly saved = output<DashboardLayoutChange>();
  readonly closed = output<void>();

  protected readonly cardIcons = CARD_TYPE_ICONS;
  protected readonly labelMaxLength = LABEL_MAX_LENGTH;
  /** The cards being arranged, in display order. */
  protected readonly cards = signal<DashboardCard[]>([]);
  protected readonly announcement = signal<Announcement | null>(null);
  protected readonly visibleCount = computed(
    () => this.cards().filter((card) => card.is_visible).length,
  );

  private readonly formBuilder = inject(FormBuilder);
  protected readonly defaults = this.formBuilder.group(
    {
      siteId: this.formBuilder.control<number | null>(null, Validators.required),
      min: this.formBuilder.control<number | null>(null, Validators.required),
      max: this.formBuilder.control<number | null>(null, Validators.required),
      label: this.formBuilder.nonNullable.control('', Validators.maxLength(LABEL_MAX_LENGTH)),
    },
    { validators: minBelowMax },
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  ngOnInit(): void {
    const config = this.config();
    this.cards.set(
      [...config.cards]
        .sort((first, second) => first.order - second.order)
        .map((card) => ({ ...card })),
    );
    const range = config.default_temperature_range;
    this.defaults.reset({
      siteId: config.default_site_id,
      min: range.min,
      max: range.max,
      label: range.label,
    });
  }

  protected move(index: number, offset: -1 | 1): void {
    const cards = [...this.cards()];
    const target = index + offset;
    if (target < 0 || target >= cards.length) {
      return;
    }
    const [card] = cards.splice(index, 1);
    cards.splice(target, 0, card);
    this.cards.set(cards);
    this.announcement.set({
      key: 'profiles.dashboard.customize.moved',
      params: { position: target + 1, total: cards.length },
    });
    this.keepFocusOn(card.card_id, offset);
  }

  protected toggle(cardId: number): void {
    this.cards.update((cards) =>
      cards.map((card) =>
        card.card_id === cardId ? { ...card, is_visible: !card.is_visible } : card,
      ),
    );
  }

  /** Shows every card again, in the default order. */
  protected restoreLayout(): void {
    const cards = this.cards();
    this.cards.set(
      DEFAULT_CARD_ORDER.flatMap((type) => {
        const card = cards.find((candidate) => candidate.card_type === type);
        return card ? [{ ...card, is_visible: true }] : [];
      }),
    );
    this.announcement.set({ key: 'profiles.dashboard.customize.restored', params: {} });
  }

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    const { siteId, min, max, label } = this.defaults.getRawValue();
    if (this.defaults.invalid || siteId === null || min === null || max === null) {
      this.defaults.markAllAsTouched();
      return;
    }
    this.saved.emit({
      cards: this.cards().map((card, index) => ({ ...card, order: index + 1 })),
      defaultSiteId: siteId,
      defaultTemperatureRange: {
        min,
        max,
        unit: this.config().default_temperature_range.unit,
        label: label.trim(),
      },
    });
  }

  protected fieldErrorKey(name: DefaultsControl): string | null {
    const control = this.defaults.controls[name];
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'shared.validation.required';
    }
    return control.hasError('maxlength') ? 'shared.validation.tooLong' : null;
  }

  /** Whether the range is inverted, once the owner has edited either limit. */
  protected rangeInvalid(): boolean {
    const { min, max } = this.defaults.controls;
    return (min.touched || max.touched) && this.defaults.hasError('minNotBelowMax');
  }

  /**
   * Moving a card re-renders its row, which loses the focus. The focus returns to the button that moved
   * it, or to the other one when the card reached the end of the list.
   */
  private keepFocusOn(cardId: number, offset: -1 | 1): void {
    afterNextRender(
      () => {
        const [preferred, fallback] = offset === -1 ? ['up', 'down'] : ['down', 'up'];
        const button = (direction: string) =>
          this.host.nativeElement.querySelector<HTMLButtonElement>(
            `#customize-card-${cardId}-${direction}`,
          );
        const target = button(preferred);
        (target && !target.disabled ? target : button(fallback))?.focus();
      },
      { injector: this.injector },
    );
  }
}
