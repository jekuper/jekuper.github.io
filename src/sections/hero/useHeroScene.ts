import { useEffect } from 'react';
import type { Engine } from '../../engine';
import type { Layout } from '../../content/types';
import { FIELD_FADE_IN, FIELD_WELL_MAGNITUDE, fieldAlpha, fieldDots, HERO_EMITTER, HERO_GROUP, SCENES } from './scene';

const RESIZE_DEBOUNCE_MS = 500;

// The field fades in on first load only; re-seeds after a resize appear at once.
let seededBefore = false;

/** Places the hero emitter and seeds the idle dot field, again after a resize. */
export function useHeroScene(engine: Engine | null, layout: Layout): void {
  useEffect(() => {
    if (!engine) return;
    const seed = () => {
      engine.resize();
      engine.removeGroup(HERO_GROUP);
      engine.clearBodies();
      const { width: w, height: h } = engine.size;
      const scene = SCENES[layout];
      engine.setEmitter(HERO_EMITTER, { x: scene.emitter.x * w, y: scene.emitter.y * h });
      const f = scene.field;
      const count = fieldDots(layout);
      const magnitude = (Math.random() < 0.5 ? -1 : 1) * FIELD_WELL_MAGNITUDE;
      const rect = { x: f.x * w, y: f.y * h, width: f.width * w, height: f.height * h };
      engine.seedField(HERO_GROUP, rect, count, magnitude, {
        alpha: fieldAlpha(count),
        fadeIn: seededBefore ? 0 : FIELD_FADE_IN,
      });
      seededBefore = true;
    };
    seed();

    let timer = 0;
    let lastWidth = window.innerWidth;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Mobile browsers resize the height while scrolling; only width counts there.
        if (layout === 'mobile' && window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        seed();
      }, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [engine, layout]);
}
