import { describe, expect, it } from 'vitest';
import { ALIVE, ParticleStore } from './particles';

describe('ParticleStore', () => {
  it('reuses freed slots and invalidates old handles', () => {
    const store = new ParticleStore(4);
    const a = store.spawn(1, 2);
    const gen = store.gen[a];
    store.destroy(a);
    expect(store.isAlive(a, gen)).toBe(false);
    const b = store.spawn(3, 4);
    expect(b).toBe(a);
    expect(store.isAlive(b, store.gen[b])).toBe(true);
    expect(store.live).toBe(1);
  });

  it('grows and keeps existing data', () => {
    const store = new ParticleStore(2);
    for (let i = 0; i < 100; i++) store.spawn(i, -i);
    expect(store.capacity).toBeGreaterThanOrEqual(100);
    expect(store.x[57]).toBe(57);
    expect(store.y[99]).toBe(-99);
    expect(store.flags[42] & ALIVE).toBe(ALIVE);
  });

  it('clear drops everything', () => {
    const store = new ParticleStore(8);
    const a = store.spawn(0, 0);
    const gen = store.gen[a];
    store.clear();
    expect(store.live).toBe(0);
    expect(store.end).toBe(0);
    expect(store.isAlive(a, gen)).toBe(false);
  });
});
