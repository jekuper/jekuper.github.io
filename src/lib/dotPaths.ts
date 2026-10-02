import { artFromContours, type LineArt, type Rgb } from '../engine';

const RING_SPACING = 3.2;
const TRACE_SPACING = 6;

/** Closed circle of dots. */
export function ring(cx: number, cy: number, r: number): Float32Array {
  const n = Math.max(6, Math.round((2 * Math.PI * r) / RING_SPACING));
  const out = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    out[k * 2] = cx + Math.cos(a) * r;
    out[k * 2 + 1] = cy + Math.sin(a) * r;
  }
  return out;
}

/** Evenly spaced dots from a to b, ends included. */
export function trace(ax: number, ay: number, bx: number, by: number): Float32Array {
  const len = Math.hypot(bx - ax, by - ay);
  const n = Math.max(2, Math.round(len / TRACE_SPACING) + 1);
  const out = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    out[k * 2] = ax + ((bx - ax) * k) / (n - 1);
    out[k * 2 + 1] = ay + ((by - ay) * k) / (n - 1);
  }
  return out;
}

export interface Shape {
  points: Float32Array;
  closed: boolean;
  color: Rgb;
}

/** Builds line art from shapes, each in its own color. */
export function shapesToArt(shapes: Shape[]): LineArt & { offsetX: number; offsetY: number } {
  const colors = shapes.map(({ points, color }) => {
    const rgb = new Uint8Array((points.length / 2) * 3);
    for (let k = 0; k < rgb.length; k += 3) rgb.set([color.r, color.g, color.b], k);
    return rgb;
  });
  return artFromContours(
    shapes.map((s) => s.points),
    colors,
    shapes.map((s) => !s.closed),
  );
}
