import { rgb } from './math';

// Distances and sizes are device pixels, times are seconds.

export const FIXED_DT = 1 / 60;
export const MAX_FRAME_DT = 0.25;

export const BACKGROUND = rgb(13, 12, 13);

/** Seconds for everything outside a focused clip to fade out, or back in. */
export const FOCUS_FADE = 0.35;

export const PARTICLE = {
  size: 3,
  spiralDuration: 3,
  emittedDamping: 0.99,
  // Field particles never lose energy, which keeps the idle field swirling.
  fieldDamping: 1,
  fieldColor: rgb(157, 157, 157),
};

/**
 * How dots travel to their spot. `arc`: a curved path timed by distance, with
 * starts staggered along the drawing order. `spiral`: the force-driven spiral.
 */
export const FLIGHT = {
  style: 'arc' as 'arc' | 'spiral',
  /** Seconds = base + distance / speed, clamped, then jittered. */
  base: 0.45,
  speed: 1400,
  minDuration: 0.5,
  maxDuration: 2.2,
  jitter: 0.15,
  /** Sideways curve as a fraction of the distance. */
  minBend: 0.12,
  maxBend: 0.4,
  /** The whole drawing starts within this many seconds, in contour order. */
  stagger: 0.9,
  retireStagger: 0.35,
};

/** Re-targeting an already formed shape (e.g. text swapped on hover): short flights that start at once. */
export const QUICK_FLIGHT = {
  base: 0.2,
  speed: 2600,
  minDuration: 0.25,
  maxDuration: 0.8,
  stagger: 0.12,
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
  quickFadeIn: 6,
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
  barColor: rgb(210, 210, 210),
  barAlpha: 0.35,
  barWidth: 14,
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
  radius: 70,
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

/** Vacuum bomb: sparks rush out, turn at the blast edge and get sucked back in. */
export const SPARKS = {
  count: 72,
  life: 0.75,
  /** Share of the life spent flying out. */
  outPortion: 0.4,
  /** How far back in time the trail reaches, seconds. */
  trail: 0.07,
  /** Reach as a multiple of the blast radius. */
  minReach: 0.7,
  maxReach: 1.4,
  /** Total swirl in radians over the life. */
  spin: 0.8,
  size: 3,
  color: rgb(255, 150, 60),
};

export const SCATTER_SPEED = 350;

/** Ambient spiral galaxy: dots on circular orbits around one hidden well. */
export const GALAXY = {
  arms: 3,
  /** Radians the arms wrap from center to edge. */
  twist: 3.2,
  /** Angular jitter around an arm, radians. */
  spread: 0.45,
  /** Inner edge as a fraction of the radius, so nothing orbits on top of the well. */
  innerRadius: 0.08,
  size: 2,
};
