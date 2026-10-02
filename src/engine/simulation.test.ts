import { describe, expect, it } from 'vitest';
import type { LineArt } from './art';
import { FIXED_DT } from './config';
import { ALIVE, FIX_ACTIVE, LINKED } from './particles';
import { DrawBatch } from './renderer';
import { World, type MorphTarget } from './simulation';

function squareArt(): LineArt {
  return {
    starts: new Uint32Array([0, 4]),
    x: new Float32Array([0, 10, 10, 0]),
    y: new Float32Array([0, 0, 10, 10]),
    rgb: new Uint8Array(12),
    pointCount: 4,
    contourCount: 1,
    width: 11,
    height: 11,
  };
}

function target(art: LineArt): MorphTarget {
  return { art, originX: 100, originY: 100, scaleX: 1, scaleY: 1, color: { r: 200, g: 0, b: 0 }, density: 200, holdTime: Infinity };
}

function run(world: World, seconds: number): void {
  const batch = new DrawBatch();
  for (let t = 0; t < seconds; t += FIXED_DT) {
    world.fixedStep(FIXED_DT);
    world.frame(FIXED_DT, batch);
  }
}

function aliveSlots(world: World): number[] {
  const p = world.particles;
  const out: number[] = [];
  for (let i = 0; i < p.end; i++) if (p.flags[i] & ALIVE) out.push(i);
  return out;
}

describe('World', () => {
  it('seeds a field with corner wells', () => {
    const world = new World();
    world.setBounds(800, 600);
    world.seedField('hero', { x: 0, y: 0, width: 400, height: 300 }, 100, 2000);
    expect(world.wells).toHaveLength(4);
    expect(world.particles.live).toBe(100);
  });

  it('spawns dots from the emitter and settles them on the art', () => {
    const world = new World();
    world.setBounds(800, 600);
    world.locateEmitter = () => ({ x: 400, y: 590 });
    world.morph('hero', target(squareArt()));
    expect(world.particles.live).toBe(4);
    run(world, 8);

    const p = world.particles;
    const slots = aliveSlots(world);
    expect(slots).toHaveLength(4);
    for (const i of slots) {
      expect(p.flags[i] & FIX_ACTIVE).toBe(FIX_ACTIVE);
      expect(p.flags[i] & LINKED).toBe(LINKED);
      expect(p.linkAlpha[i]).toBe(1);
    }
    const xs = slots.map((i) => Math.round(p.x[i])).sort((a, b) => a - b);
    expect(xs).toEqual([100, 100, 110, 110]);
  });

  it('retires extra dots into the emitter', () => {
    const world = new World();
    world.setBounds(800, 600);
    world.locateEmitter = () => ({ x: 400, y: 590 });
    world.seedField('hero', { x: 0, y: 0, width: 400, height: 300 }, 50, 0);
    world.morph('hero', target(squareArt()));
    run(world, 10);
    expect(world.particles.live).toBe(4);
  });

  it('erases dots and wells under the cursor', () => {
    const world = new World();
    world.setBounds(800, 600);
    world.seedField('hero', { x: 100, y: 100, width: 10, height: 10 }, 4, 0);
    world.cursorX = 105;
    world.cursorY = 105;
    world.eraseAtCursor();
    expect(world.particles.live).toBe(0);
    expect(world.wells).toHaveLength(0);
  });
});
