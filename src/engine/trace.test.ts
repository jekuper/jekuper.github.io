import { describe, expect, it } from 'vitest';
import { artFromContours, loopLength, resampleLoop, traceMask } from './trace';

function maskFrom(rows: string[]): { mask: Uint8Array; width: number; height: number } {
  const width = rows[0].length;
  const height = rows.length;
  const mask = new Uint8Array(width * height);
  rows.forEach((row, y) => [...row].forEach((c, x) => (mask[y * width + x] = c === '#' ? 1 : 0)));
  return { mask, width, height };
}

describe('traceMask', () => {
  it('outlines a filled square with one loop', () => {
    const { mask, width, height } = maskFrom(['....', '.##.', '.##.', '....']);
    const loops = traceMask(mask, width, height);
    expect(loops).toHaveLength(1);
    expect(loopLength(loops[0])).toBeCloseTo(8 - 4 + 4 * Math.SQRT1_2, 5);
  });

  it('finds the hole of a ring', () => {
    const { mask, width, height } = maskFrom(['#####', '#...#', '#...#', '#...#', '#####']);
    expect(traceMask(mask, width, height)).toHaveLength(2);
  });

  it('closes shapes touching the border', () => {
    const { mask, width, height } = maskFrom(['##', '##']);
    expect(traceMask(mask, width, height)).toHaveLength(1);
  });
});

describe('resampleLoop', () => {
  it('spaces points evenly', () => {
    const square = new Float32Array([0, 0, 10, 0, 10, 10, 0, 10]);
    const points = resampleLoop(square, 2);
    expect(points.length / 2).toBe(20);
    expect(points[2]).toBeCloseTo(2, 5);
  });
});

describe('artFromContours', () => {
  it('normalizes to the origin and reports the offset', () => {
    const art = artFromContours([new Float32Array([5, 7, 9, 7]), new Float32Array([6, 10])]);
    expect(art.pointCount).toBe(3);
    expect(art.contourCount).toBe(2);
    expect(art.offsetX).toBe(5);
    expect(art.offsetY).toBe(7);
    expect(Array.from(art.x)).toEqual([0, 4, 1]);
    expect(art.width).toBe(5);
  });
});
