import { rgb } from './math';

// Distances and sizes are device pixels, times are seconds.

export const FIXED_DT = 1 / 60;
export const MAX_FRAME_DT = 0.25;

export const BACKGROUND = rgb(13, 12, 13);

export const PARTICLE = {
  size: 3,
  spiralDuration: 3,
  emittedDamping: 0.99,
  // Field particles never lose energy, which keeps the idle field swirling.
  fieldDamping: 1,
  fieldColor: rgb(157, 157, 157),
};

export const SPIRAL = {
  stiffness: 140,
  settleDamping: 0.5,
  snapDistance: 5,
  minRadius: 100,
  radiusRange: 150,
  minDuration: 2,
  durationRange: 3,
  artColorFade: 5,
};

export const LINK = {
  width: 3,
  fadeIn: 2,
  fadeOut: -2,
};

export const WELL = {
  size: 10,
  color: rgb(98, 0, 204),
  damping: 0.99,
  clickMagnitude: 20000,
  fieldMagnitude: 2000,
};

export const BOMB = {
  size: 6,
  color: rgb(200, 0, 0),
  damping: 0.99,
  blastRadius: 50,
  triggerDistance: 10,
  // Applied to the drag vector in CSS pixels, not device pixels.
  launchScale: 3,
  dragThreshold: 2,
  aimStartColor: rgb(255, 255, 255),
  aimEndColor: rgb(66, 56, 56),
};

export const ERASER = {
  radius: 15,
  color: rgb(255, 255, 255),
};

export const EMITTER = {
  width: 10,
  heightRatio: 0.005,
  maxHeight: 0.3,
  inset: 0.1,
};

export const MORPH = {
  fadeOutTime: 0.4,
  dissolveTime: 0.8,
};

export const SHAKE = {
  duration: 0.5,
  amplitude: 0.01,
};

export const GRAVITY = {
  barnesHutThreshold: 64,
  theta: 0.75,
};

export const CURSOR = {
  radius: 140,
  /** Pull at the cursor, falling to zero at the radius. */
  strength: 2200,
  /** Velocity kept per step inside the radius, so stirring does not heat the field. */
  drag: 0.97,
};

export const TRAIL = {
  length: 28,
  startColor: rgb(200, 0, 0),
  endColor: rgb(40, 0, 0),
};

export const SPARKS = {
  count: 48,
  speed: 520,
  life: 0.7,
  size: 3,
  damping: 0.94,
  color: rgb(255, 150, 60),
};

export const SCATTER_SPEED = 600;
