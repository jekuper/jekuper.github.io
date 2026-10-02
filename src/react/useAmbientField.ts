import { useEffect, useId, type RefObject } from 'react';
import { useEngine } from './engineContext';

const WELL_MAGNITUDE = 1500;
const FADE_IN = 0.8;

/** A drifting dot field over an element while it is on screen; removed when it leaves. */
export function useAmbientField(ref: RefObject<HTMLElement | null>, count: number, alpha: number): void {
  const engine = useEngine();
  const group = `ambient-${useId()}`;

  useEffect(() => {
    const el = ref.current;
    if (!engine || !el) return;
    const observer = new IntersectionObserver(([entry]) => {
      engine.removeGroup(group);
      if (!entry.isIntersecting) return;
      const rect = el.getBoundingClientRect();
      const corner = engine.viewToWorld(rect.left, rect.top);
      const magnitude = (Math.random() < 0.5 ? -1 : 1) * WELL_MAGNITUDE;
      engine.seedField(group, { x: corner.x, y: corner.y, width: rect.width, height: rect.height }, count, magnitude, {
        alpha,
        fadeIn: FADE_IN,
        hiddenWells: true,
      });
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      engine.removeGroup(group);
    };
  }, [engine, group, ref, count, alpha]);
}
