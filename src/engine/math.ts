export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const rgb = (r: number, g: number, b: number): Rgb => ({ r, g, b });

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomSign(): number {
  return Math.random() < 0.5 ? -1 : 1;
}

export function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Sampled at 1% steps on purpose: spiral motion is tuned against this table.
const EASE_STEPS = 100;
const EASE_TABLE = new Float64Array(EASE_STEPS + 1);
for (let i = 0; i <= EASE_STEPS; i++) EASE_TABLE[i] = easeInOutCubic(i / EASE_STEPS);

export function easeInOutCubicStepped(t: number): number {
  return EASE_TABLE[Math.min(Math.floor(t * EASE_STEPS), EASE_STEPS)];
}

export function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const cx = bx - ax;
  const cy = by - ay;
  const lenSq = cx * cx + cy * cy;
  const t = lenSq !== 0 ? ((px - ax) * cx + (py - ay) * cy) / lenSq : -1;
  let nx = ax;
  let ny = ay;
  if (t > 1) {
    nx = bx;
    ny = by;
  } else if (t >= 0) {
    nx = ax + t * cx;
    ny = ay + t * cy;
  }
  return Math.hypot(px - nx, py - ny);
}

export function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}
