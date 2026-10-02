import { describe, expect, it } from 'vitest';
import { BarnesHutTree, GravityField, type GravitySource } from './gravity';

function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

// Returns the exact acceleration and the sum of per-source magnitudes as an error scale.
function direct(sources: GravitySource[], x: number, y: number): [number, number, number] {
  let ax = 0;
  let ay = 0;
  let scale = 0;
  for (const s of sources) {
    const dx = s.x - x;
    const dy = s.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 === 0) continue;
    const f = s.magnitude / Math.max(1, d2);
    ax += f * dx;
    ay += f * dy;
    scale += Math.abs(f) * Math.sqrt(d2);
  }
  return [ax, ay, scale];
}

function randomSources(n: number, rand: () => number): GravitySource[] {
  return Array.from({ length: n }, () => ({
    x: rand() * 2000,
    y: rand() * 1200,
    magnitude: 500 + rand() * 20000,
  }));
}

describe('GravityField', () => {
  it('is exact for a few sources', () => {
    const sources = randomSources(5, seeded(1));
    const field = new GravityField();
    field.build(sources);
    field.sample(300, 400);
    const [ax, ay] = direct(sources, 300, 400);
    expect(field.ax).toBeCloseTo(ax, 9);
    expect(field.ay).toBeCloseTo(ay, 9);
  });

  it('ignores a source at the sample point', () => {
    const field = new GravityField();
    field.build([{ x: 10, y: 10, magnitude: 100 }]);
    field.sample(10, 10);
    expect(field.ax).toBe(0);
    expect(field.ay).toBe(0);
  });
});

describe('BarnesHutTree', () => {
  it('approximates direct summation', () => {
    const rand = seeded(42);
    const sources = randomSources(800, rand);
    const tree = new BarnesHutTree();
    tree.build(sources);
    for (let k = 0; k < 200; k++) {
      const x = rand() * 2000;
      const y = rand() * 1200;
      tree.sample(x, y);
      const [ax, ay, scale] = direct(sources, x, y);
      expect(Math.hypot(tree.ax - ax, tree.ay - ay) / scale).toBeLessThan(0.02);
    }
  });

  it('handles coincident sources', () => {
    const sources = Array.from({ length: 10 }, () => ({ x: 5, y: 5, magnitude: 1 }));
    const tree = new BarnesHutTree();
    tree.build(sources);
    tree.sample(105, 5);
    expect(tree.ax).toBeCloseTo(-0.1, 9);
  });
});
