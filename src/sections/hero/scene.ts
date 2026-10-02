import { estimateDotBudget, rgb, type Rgb } from '../../engine';
import type { Layout } from '../../content/types';

export const HERO_GROUP = 'hero';
export const FIELD_DOTS = 4900;
const MAX_FIELD_DOTS = 500_000;
/** CPU time per frame the field may use, and its size cap, per layout. */
const FIELD_BUDGET: Record<Layout, { ms: number; max: number }> = {
  desktop: { ms: 4, max: 40000 },
  mobile: { ms: 2, max: 12000 },
};
export const FIELD_FADE_IN = 1.5;
export const INTRO_FONT = '"Spaced", "Space Grotesk", sans-serif';
export const INTRO_COLOR = rgb(210, 210, 210);
export const INTRO_HOLD = 1.8;
export const INTRO_FIELD_DELAY_MS = 6000;
export const FIELD_WELL_MAGNITUDE = 2000;
export const ART_DENSITY = 200;
export const ART_MANIFEST = 'art/lineart/manifest.json';

/** Fractions of the canvas size. */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScenePreset {
  field: Box;
  /** Art is centered at (x, y) and fitted into width by height. */
  art: Box;
  palette: Rgb[];
  neutral: Rgb;
  /** Chance of the neutral color when a palette exists. */
  neutralChance: number;
}

const NEUTRAL = rgb(190, 190, 190);

export const SCENES: Record<Layout, ScenePreset> = {
  desktop: {
    field: { x: 0.5, y: 0.01, width: 0.49, height: 0.98 },
    art: { x: 0.75, y: 0.5, width: 0.45, height: 0.8 },
    palette: [rgb(240, 83, 101), rgb(92, 107, 209), rgb(239, 117, 102)],
    neutral: NEUTRAL,
    neutralChance: 0.1,
  },
  mobile: {
    field: { x: 0.01, y: 0.01, width: 0.98, height: 0.98 },
    art: { x: 0.5, y: 0.5, width: 0.8, height: 0.8 },
    palette: [],
    neutral: NEUTRAL,
    neutralChance: 1,
  },
};

export function pickColor(preset: ScenePreset): Rgb {
  if (preset.palette.length === 0 || Math.random() < preset.neutralChance) return preset.neutral;
  return preset.palette[Math.floor(Math.random() * preset.palette.length)];
}

let dotsPerMs: number | null = null;

/** Field size for this device, overridable with `?dots=N` for stress testing. */
export function fieldDots(layout: Layout): number {
  const requested = Number(new URLSearchParams(window.location.search).get('dots'));
  if (requested > 0) return Math.min(Math.floor(requested), MAX_FIELD_DOTS);
  const { ms, max } = FIELD_BUDGET[layout];
  dotsPerMs ??= estimateDotBudget(1);
  return Math.max(FIELD_DOTS, Math.min(max, Math.floor(dotsPerMs * ms)));
}

/** Denser fields get fainter dots so overlaps glow instead of turning into a solid sheet. */
export function fieldAlpha(count: number): number {
  return Math.min(1, Math.max(0.35, Math.sqrt(FIELD_DOTS / count)));
}

/** Intro text layout: center and width as fractions of the screen. */
export const INTRO_PLACEMENT: Record<Layout, { x: number; y: number; width: number }> = {
  desktop: { x: 0.75, y: 0.5, width: 0.4 },
  mobile: { x: 0.5, y: 0.4, width: 0.86 },
};
