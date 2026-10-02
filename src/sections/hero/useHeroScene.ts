import { useEffect } from 'react';
import type { Engine } from '../../engine';
import type { Layout } from '../../content/types';
import { FIELD_WELL_MAGNITUDE, fieldDots, HERO_GROUP, SCENES } from './scene';

const RESIZE_DEBOUNCE_MS = 500;

/** Seeds the idle dot field, and re-seeds it after the canvas is resized. */
export function useHeroScene(engine: Engine | null, canvas: HTMLCanvasElement | null, layout: Layout): void {
  useEffect(() => {
    if (!engine || !canvas) return;
    const seed = () => {
      engine.resize();
      engine.clear();
      const f = SCENES[layout].field;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const magnitude = (Math.random() < 0.5 ? -1 : 1) * FIELD_WELL_MAGNITUDE;
      engine.seedField(HERO_GROUP, { x: f.x * w, y: f.y * h, width: f.width * w, height: f.height * h }, fieldDots(), magnitude);
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
  }, [engine, canvas, layout]);
}
