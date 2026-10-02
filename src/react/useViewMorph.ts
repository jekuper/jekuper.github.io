import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react';
import type { LineArt, Rgb } from '../engine';
import { useEngine } from './engineContext';

/** Art placed over a viewport rectangle (CSS pixels). */
export interface ViewArt {
  art: LineArt;
  left: number;
  top: number;
  width: number;
  height: number;
  color: Rgb;
}

const RESIZE_DEBOUNCE_MS = 400;
const DENSITY = 200;

/**
 * Forms a dot group over an element while it is on screen and sends the dots
 * back into the emitter once it leaves. `build` measures the element and
 * returns the art in viewport coordinates.
 */
export function useViewMorph(
  ref: RefObject<HTMLElement | null>,
  build: (el: HTMLElement) => Promise<ViewArt | null>,
): { group: string; formed: boolean; scatter: () => void; reform: () => void } {
  const engine = useEngine();
  const group = `view-${useId()}`;
  const [formed, setFormed] = useState(false);
  const visible = useRef(false);
  const request = useRef(0);
  const buildRef = useRef(build);
  buildRef.current = build;

  const reform = useCallback(async () => {
    const el = ref.current;
    if (!engine || !el || !visible.current) return;
    const id = ++request.current;
    const placed = await buildRef.current(el);
    if (!placed || id !== request.current || !visible.current) return;
    const center = engine.viewToWorld(placed.left + placed.width / 2, placed.top + placed.height / 2);
    engine.morph(group, {
      art: placed.art,
      centerX: center.x,
      centerY: center.y,
      width: placed.width,
      height: placed.height,
      color: placed.color,
      density: DENSITY,
    });
    setFormed(true);
  }, [engine, group, ref]);

  useEffect(() => {
    const el = ref.current;
    if (!engine || !el) return;
    const pending = request;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        void reform().catch((err) => console.error(err));
      } else {
        request.current++;
        engine.dissolve(group);
      }
    });
    observer.observe(el);

    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void reform().catch((err) => console.error(err)), RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      pending.current++;
      engine.dissolve(group);
    };
  }, [engine, group, ref, reform]);

  const scatter = useCallback(() => {
    request.current++;
    engine?.scatter(group);
  }, [engine, group]);

  return { group, formed, scatter, reform: () => void reform().catch((err) => console.error(err)) };
}
