import { useEffect } from 'react';
import { textToArt, type Engine } from '../../engine';
import type { Layout } from '../../content/types';
import {
  ART_DENSITY,
  FIELD_FADE_IN,
  FIELD_WELL_MAGNITUDE,
  fieldAlpha,
  fieldDots,
  HERO_GROUP,
  INTRO_COLOR,
  INTRO_FIELD_DELAY_MS,
  INTRO_FONT,
  INTRO_HOLD,
  INTRO_PLACEMENT,
  SCENES,
} from './scene';

const RESIZE_DEBOUNCE_MS = 500;
const INTRO_DOT_SPACING = 4;
const INTRO_MAX_DOTS = 4000;

// Plays once per page load; re-seeds after a resize skip it.
let introDone = false;

/** Writes `name` in dots, then throws them into the field. */
async function playIntro(engine: Engine, layout: Layout, name: string): Promise<void> {
  const { width: w, height: h } = engine.size;
  const place = INTRO_PLACEMENT[layout];
  await document.fonts.load(`100px ${INTRO_FONT}`);

  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = `100px ${INTRO_FONT}`;
  const fontSize = (100 * place.width * w) / probe.measureText(name).width;
  const { art } = textToArt(name, {
    font: `${fontSize}px ${INTRO_FONT}`,
    spacing: INTRO_DOT_SPACING,
    maxPoints: INTRO_MAX_DOTS,
  });
  // Same group as the field, so a skill click later reuses these dots.
  engine.morph(HERO_GROUP, {
    art,
    centerX: place.x * w,
    centerY: place.y * h,
    width: art.width,
    height: art.height,
    color: INTRO_COLOR,
    density: ART_DENSITY,
    holdTime: INTRO_HOLD,
    afterHold: 'scatter',
  });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Seeds the idle dot field, with an intro on first load, and re-seeds after a resize. */
export function useHeroScene(engine: Engine | null, layout: Layout, name: string): void {
  useEffect(() => {
    if (!engine) return;
    const seed = (fadeIn = 0) => {
      const { width: w, height: h } = engine.size;
      const f = SCENES[layout].field;
      const count = fieldDots(layout);
      const magnitude = (Math.random() < 0.5 ? -1 : 1) * FIELD_WELL_MAGNITUDE;
      const rect = { x: f.x * w, y: f.y * h, width: f.width * w, height: f.height * h };
      engine.seedField(HERO_GROUP, rect, count, magnitude, { alpha: fieldAlpha(count), fadeIn });
    };

    const reset = () => {
      engine.resize();
      engine.removeGroup(HERO_GROUP);
      engine.clearBodies();
    };

    reset();
    let introTimer = 0;
    if (introDone || prefersReducedMotion()) {
      seed();
    } else {
      playIntro(engine, layout, name).catch((err) => console.error(err));
      introTimer = window.setTimeout(() => {
        introDone = true;
        seed(FIELD_FADE_IN);
      }, INTRO_FIELD_DELAY_MS);
    }

    let resizeTimer = 0;
    let lastWidth = window.innerWidth;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        // Mobile browsers resize the height while scrolling; only width counts there.
        if (layout === 'mobile' && window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        window.clearTimeout(introTimer);
        introDone = true;
        reset();
        seed();
      }, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(introTimer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [engine, layout, name]);
}
