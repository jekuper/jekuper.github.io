import { useEffect, useId, type RefObject } from 'react';
import type { Rgb } from '../engine';
import { useEngine } from './engineContext';

export interface GalaxyPlacement {
  /** Center as fractions of the element box. */
  x: number;
  y: number;
  /** Radius as a fraction of the element height. */
  radius: number;
  count: number;
  /** Pull of the hidden center; orbit speed is its square root. */
  magnitude: number;
  alpha: number;
  color: Rgb;
}

const FADE_IN = 1.2;

/** A slowly turning spiral of dots behind an element, only while it is on screen. */
export function useGalaxy(ref: RefObject<HTMLElement | null>, placement: GalaxyPlacement): void {
  const engine = useEngine();
  const group = `galaxy-${useId()}`;
  const { x, y, radius, count, magnitude, alpha, color } = placement;

  useEffect(() => {
    const el = ref.current;
    if (!engine || !el) return;
    const observer = new IntersectionObserver(([entry]) => {
      engine.removeGroup(group);
      if (!entry.isIntersecting) return;
      const rect = el.getBoundingClientRect();
      const center = engine.viewToWorld(rect.left + rect.width * x, rect.top + rect.height * y);
      engine.seedGalaxy(group, center, rect.height * radius, count, magnitude, { alpha, color, fadeIn: FADE_IN });
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      engine.removeGroup(group);
    };
  }, [engine, group, ref, x, y, radius, count, magnitude, alpha, color]);
}
