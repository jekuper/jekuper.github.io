import { useEffect, type RefObject } from 'react';
import type { Engine } from '../../engine';
import type { Layout } from '../../content/types';
import { FIELD_FADE_IN, FIELD_WELL_MAGNITUDE, fieldAlpha, fieldDots, HERO_CLIP, HERO_EMITTER, HERO_GROUP, SCENES } from './scene';

const RESIZE_DEBOUNCE_MS = 500;

// The field fades in on first load only; re-seeds after a resize appear at once.
let seededBefore = false;

/** Places the hero emitter and clip region and seeds the idle dot field, again after a resize. */
export function useHeroScene(engine: Engine | null, layout: Layout, root: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!engine) return;
    // Desktop pins the world while the hero scrolls, so the hero owns the first screen of it.
    // On phones nothing is pinned and the hero owns its own box.
    const defineClip = () => {
      const { width: w, height: h } = engine.size;
      const el = root.current;
      if (layout === 'mobile' && el) {
        const rect = el.getBoundingClientRect();
        const corner = engine.viewToWorld(rect.left, rect.top);
        engine.defineClip(HERO_CLIP, { x: corner.x, y: corner.y, width: rect.width, height: rect.height });
      } else {
        engine.defineClip(HERO_CLIP, { x: 0, y: 0, width: w, height: h });
      }
    };
    const resizeObserver = new ResizeObserver(defineClip);
    if (root.current) resizeObserver.observe(root.current);

    const seed = () => {
      engine.resize();
      engine.removeGroup(HERO_GROUP);
      engine.clearBodies();
      const { width: w, height: h } = engine.size;
      const scene = SCENES[layout];
      engine.setEmitter(HERO_EMITTER, { x: scene.emitter.x * w, y: scene.emitter.y * h });
      defineClip();
      const f = scene.field;
      const count = fieldDots(layout);
      const magnitude = (Math.random() < 0.5 ? -1 : 1) * FIELD_WELL_MAGNITUDE;
      const rect = { x: f.x * w, y: f.y * h, width: f.width * w, height: f.height * h };
      engine.seedField(HERO_GROUP, rect, count, magnitude, {
        alpha: fieldAlpha(count),
        fadeIn: seededBefore ? 0 : FIELD_FADE_IN,
        clip: HERO_CLIP,
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
      resizeObserver.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [engine, layout, root]);
}
