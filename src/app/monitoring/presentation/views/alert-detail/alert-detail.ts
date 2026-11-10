import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AlertSeverity } from '@monitoring/domain/value-objects/alert-severity';
import { MonitoringStore } from '@monitoring/application/monitoring-store';
import type { AlertDismissal } from '@monitoring/application/contracts/alert-dismissal';
import { DismissAlertDialog } from '@monitoring/presentation/components/dismiss-alert-dialog/dismiss-alert-dialog';
import { ResolveAlertDialog } from '@monitoring/presentation/components/resolve-alert-dialog/resolve-alert-dialog';
import {
  ALERT_SEVERITY_APPEARANCE,
  ALERT_STATUS_APPEARANCE,
  ALERT_TYPE_ICONS,
} from '@monitoring/presentation/monitoring-appearance';
import {
  ALERT_ACTION_SUCCESS_KEYS,
  alertActionErrorKey,
} from '@monitoring/presentation/monitoring-feedback';
import { Icon } from '@shared/presentation/components/icon/icon';
import { SIGNED_IN_ACCOUNT } from '@shared/presentation/components/private-layout/signed-in-account';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { LocalizedNumberPipe } from '@shared/presentation/pipes/localized-number.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Who took a lifecycle step, as recorded by the backend:
 * - `you`: the signed-in account.
 * - `user`: another account, shown by its identifier.
 * - `automatic`: the platform resolved the alert itself, because the readings returned within range.
 * - `unrecorded`: the backend recorded no one.
 */
type Actor =
  | { readonly kind: 'you' | 'automatic' | 'unrecorded' }
  | { readonly kind: 'user'; readonly id: number };

interface LifecycleStep {
  readonly step: 'opened' | 'acknowledged' | 'resolved' | 'dismissed';
  readonly at: Date;
  readonly actor: Actor | null;
}

/**
 * Detail of an alert, whatever its status: what was detected, on which equipment, the reading that
 * triggered it, and its lifecycle with who acted and when. Active alerts can be acknowledged, resolved or
 * dismissed with a reason and, when critical, turned into a corrective service request draft that the
 * owner reviews and submits in Service Request Management.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    DismissAlertDialog,
    ResolveAlertDialog,
    Icon,
    StatePanel,
    StatusTag,
    LocalizedDatePipe,
    LocalizedNumberPipe,
    TemperaturePipe,
  ],
  selector: 'app-alert-detail',
  styleUrl: './alert-detail.css',
  templateUrl: './alert-detail.html',
})
export class AlertDetail {
  protected readonly store = inject(MonitoringStore);
  private readonly account = inject(SIGNED_IN_ACCOUNT);
  protected readonly severityAppearance = ALERT_SEVERITY_APPEARANCE;
  protected readonly statusAppearance = ALERT_STATUS_APPEARANCE;
  protected readonly typeIcons = ALERT_TYPE_ICONS;

  private readonly alertId = signal(0);
  /** The confirmation dialog that is open. */
  protected readonly confirming = signal<'resolve' | 'dismiss' | null>(null);

  protected readonly detail = computed(() => {
    const detail = this.store.selectedAlert();
    return detail?.alert.id === this.alertId() ? detail : null;
  });
  protected readonly alert = computed(() => this.detail()?.alert ?? null);
  protected readonly equipment = computed(() => this.detail()?.equipment ?? null);
  protected readonly status = computed<'loading' | 'error' | 'not-found' | 'ready'>(() => {
    if (this.detail() !== null) {
      return 'ready';
    }
    switch (this.store.selectedAlertFailure()) {
      case null:
        return 'loading';
      case 'NOT_FOUND':
      case 'ACCESS_DENIED':
        return 'not-found';
      default:
        return 'error';
    }
  });
  protected readonly active = computed(() => this.alert()?.isActive() ?? false);
  protected readonly critical = computed(() => this.alert()?.severity === AlertSeverity.CRITICAL);
  protected readonly durationMinutes = computed(() => {
    const seconds = this.alert()?.total_duration_seconds ?? null;
    return seconds === null ? null : Math.round(seconds / 60);
  });
  protected readonly lifecycle = computed<LifecycleStep[]>(() => {
    const alert = this.alert();
    if (alert === null) {
      return [];
    }
    const steps: LifecycleStep[] = [{ step: 'opened', at: alert.opened_at, actor: null }];
    if (alert.acknowledged_at !== null) {
      steps.push({
        step: 'acknowledged',
        at: alert.acknowledged_at,
        actor: this.actorOf(alert.acknowledged_by),
      });
    }
    if (alert.resolved_at !== null) {
      steps.push({
        step: 'resolved',
        at: alert.resolved_at,
        // The backend records no one when the readings resolved the alert by themselves.
        actor: alert.resolved_by === null ? { kind: 'automatic' } : this.actorOf(alert.resolved_by),
      });
    }
    if (alert.dismissed_at !== null) {
      steps.push({
        step: 'dismissed',
        at: alert.dismissed_at,
        actor: this.actorOf(alert.dismissed_by),
      });
    }
    return steps;
  });

  /** The confirmation announced after the last successful action on this alert. */
  protected readonly announcement = computed(() => {
    const state = this.store.alertActionState();
    return state?.status === 'succeeded' && state.alertId === this.alertId()
      ? ALERT_ACTION_SUCCESS_KEYS[state.action]
      : null;
  });
  /** Why the last action on this alert failed, outside a confirmation dialog. */
  protected readonly actionErrorKey = computed(() => {
    const state = this.store.alertActionState();
    return state?.status === 'failed' &&
      state.alertId === this.alertId() &&
      this.confirming() === null
      ? alertActionErrorKey(state.failure)
      : null;
  });
  /** Why the action being confirmed failed. */
  protected readonly dialogErrorKey = computed(() => {
    const state = this.store.alertActionState();
    return state?.status === 'failed' && this.confirming() !== null
      ? alertActionErrorKey(state.failure)
      : null;
  });

  constructor() {
    this.store.connectLiveUpdates(inject(DestroyRef));
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.alertId.set(Number(params.get('alertId')));
        this.store.clearAlertAction();
        this.confirming.set(null);
        this.load();
      });
    // A successful resolution or dismissal closes its dialog.
    effect(() => {
      if (this.store.alertActionState()?.status === 'succeeded') {
        this.confirming.set(null);
      }
    });
  }

  protected load(): void {
    this.store.loadAlert(this.alertId());
  }

  protected acknowledge(): void {
    const alert = this.alert();
    if (alert !== null) {
      this.store.acknowledgeAlert(alert);
    }
  }

  protected confirm(action: 'resolve' | 'dismiss'): void {
    this.store.clearAlertAction();
    this.confirming.set(action);
  }

  protected closeConfirmation(): void {
    this.store.clearAlertAction();
    this.confirming.set(null);
  }

  protected resolve(): void {
    const alert = this.alert();
    if (alert !== null) {
      this.store.resolveAlert(alert);
    }
  }

  protected dismiss(dismissal: AlertDismissal): void {
    const alert = this.alert();
    if (alert !== null) {
      this.store.dismissAlert(alert, dismissal);
    }
  }

  private actorOf(userId: number | null): Actor {
    if (userId === null) {
      return { kind: 'unrecorded' };
    }
    return this.account()?.id === userId ? { kind: 'you' } : { kind: 'user', id: userId };
  }
}
