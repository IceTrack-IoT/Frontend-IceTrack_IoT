import { DestroyRef, inject, InjectionToken, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** The load state of a view whose data is mocked. */
export type MockLoadStatus = 'loading' | 'error' | 'ready';

/** Simulated latency, in milliseconds, of mocked loads and mutations. Tests may provide 0. */
export const MOCK_LATENCY_MS = new InjectionToken<number>('MOCK_LATENCY_MS', {
  factory: () => 600,
});

/**
 * Simulates the asynchronous behavior of a view whose data is mocked: loads and UI-only mutations resolve
 * after a short delay, so the loading, error, empty and pending states render as they will with real data.
 * The `mockState` query parameter forces a state for review: `?mockState=error` fails the first load (a
 * retry succeeds) and `?mockState=empty` loads no data.
 *
 * TODO: Remove once the views read their data from the application stores of their bounded contexts.
 */
export class MockDataSource {
  private readonly statusSignal = signal<MockLoadStatus>('loading');
  readonly status = this.statusSignal.asReadonly();

  private readonly pendingSignal = signal(false);
  /** Whether a mutation is in progress. */
  readonly pending = this.pendingSignal.asReadonly();

  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private failNextLoad: boolean;

  constructor(
    private readonly latency: number,
    /** Whether the view must load no data. */
    readonly forcedEmpty: boolean,
    failFirstLoad: boolean,
    destroyRef: DestroyRef,
  ) {
    this.failNextLoad = failFirstLoad;
    destroyRef.onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));
  }

  /**
   * Loads the view data after the simulated latency.
   * @param apply - Sets the view data; it receives whether the view must load no data.
   */
  load(apply: (empty: boolean) => void): void {
    this.statusSignal.set('loading');
    this.schedule(() => {
      if (this.failNextLoad) {
        this.failNextLoad = false;
        this.statusSignal.set('error');
        return;
      }
      apply(this.forcedEmpty);
      this.statusSignal.set('ready');
    });
  }

  /**
   * Applies a UI-only mutation after the simulated latency, exposing it as pending meanwhile. A mutation
   * requested while another one is pending is ignored.
   * @param apply - Applies the mutation to the view state.
   */
  mutate(apply: () => void): void {
    if (this.pendingSignal()) {
      return;
    }
    this.pendingSignal.set(true);
    this.schedule(() => {
      apply();
      this.pendingSignal.set(false);
    });
  }

  private schedule(task: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      task();
    }, this.latency);
    this.timers.add(timer);
  }
}

/**
 * Creates the mock data source of a routed view. Must be called in an injection context, such as a field
 * initializer of the view.
 * @returns The mock data source of the view.
 */
export function injectMockDataSource(): MockDataSource {
  const mockState = inject(ActivatedRoute).snapshot.queryParamMap.get('mockState');
  return new MockDataSource(
    inject(MOCK_LATENCY_MS),
    mockState === 'empty',
    mockState === 'error',
    inject(DestroyRef),
  );
}
