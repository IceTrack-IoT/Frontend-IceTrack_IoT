import { DestroyRef } from '@angular/core';
import { MockDataSource } from './mock-data-source';

describe('MockDataSource', () => {
  const destroyRef = { onDestroy: () => () => undefined } as unknown as DestroyRef;
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

  it('loads the data after the latency', async () => {
    const source = new MockDataSource(0, false, false, destroyRef);
    const apply = vi.fn();

    source.load(apply);
    expect(source.status()).toBe('loading');
    await settle();

    expect(apply).toHaveBeenCalledWith(false);
    expect(source.status()).toBe('ready');
  });

  it('fails the first load when an error is forced, and succeeds on retry', async () => {
    const source = new MockDataSource(0, false, true, destroyRef);
    const apply = vi.fn();

    source.load(apply);
    await settle();
    expect(source.status()).toBe('error');
    expect(apply).not.toHaveBeenCalled();

    source.load(apply);
    await settle();
    expect(source.status()).toBe('ready');
  });

  it('asks for no data when an empty load is forced', async () => {
    const source = new MockDataSource(0, true, false, destroyRef);
    const apply = vi.fn();

    source.load(apply);
    await settle();

    expect(apply).toHaveBeenCalledWith(true);
  });

  it('exposes a mutation as pending and ignores another one meanwhile', async () => {
    const source = new MockDataSource(0, false, false, destroyRef);
    const first = vi.fn();
    const second = vi.fn();

    source.mutate(first);
    source.mutate(second);
    expect(source.pending()).toBe(true);
    await settle();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(source.pending()).toBe(false);
  });
});
