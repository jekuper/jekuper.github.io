/** Gravity source. Negative magnitude repels. */
export interface Well {
  x: number;
  y: number;
  vx: number;
  vy: number;
  magnitude: number;
  /** Drawn above particles (user placed) or below (scene placed). */
  onTop: boolean;
  /** Top of the screen-sized band it wraps within, in world pixels. */
  wrapTop: number;
}

export interface Bomb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Where the drag started; the aim line points here. */
  anchorX: number;
  anchorY: number;
  /** False while aiming (follows the cursor), true once launched. */
  flying: boolean;
  triggered: boolean;
  wrapTop: number;
  /** Recent positions as x, y pairs, newest last. */
  trail: number[];
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export function createWell(x: number, y: number, magnitude: number, onTop: boolean, wrapTop: number): Well {
  return { x, y, vx: 0, vy: 0, magnitude, onTop, wrapTop };
}

export function createBomb(x: number, y: number): Bomb {
  return { x, y, vx: 0, vy: 0, anchorX: x, anchorY: y, flying: false, triggered: false, wrapTop: 0, trail: [] };
}
