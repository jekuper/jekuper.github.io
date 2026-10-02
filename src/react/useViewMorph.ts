import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react';
import type { LineArt, Point, Rgb } from '../engine';
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

export interface ViewMorphOptions {
  /** Where this group's dots spawn and return, from the element's viewport rect. */
  emitter?: (rect: DOMRect) => Point;
  /** Extra condition besides being on screen. */
  active?: boolean;
  /** What happens when the group goes away: back into the emitter, or thrown outward. */
  hide?: 'dissolve' | 'scatter';
}

const RESIZE_DEBOUNCE_MS = 400;
const DENSITY = 200;
const EMITTER_GAP = 24;

export const belowElement = (rect: DOMRect): Point => ({ x: rect.left + rect.width / 2, y: rect.bottom + EMITTER_GAP });

/**
 * Forms a dot group over an element while it is on screen (and `active`), with
 * its own emitter placed next to it in the world. `build` measures the element
 * and returns the art in viewport coordinates.
 */
export function useViewMorph(
  ref: RefObject<HTMLElement | null>,
  build: (el: HTMLElement) => Promise<ViewArt | null>,
  options: ViewMorphOptions = {},
): { group: string; formed: boolean; scatter: () => void; reform: () => void } {
  const engine = useEngine();
  const group = `view-${useId()}`;
  const [formed, setFormed] = useState(false);
  const onScreen = useRef(false);
  const active = options.active ?? true;
  const activeRef = useRef(active);
  activeRef.current = active;
  const request = useRef(0);
  const buildRef = useRef(build);
  buildRef.current = build;
  const emitterRef = useRef(options.emitter ?? belowElement);
  emitterRef.current = options.emitter ?? belowElement;
  const hide = options.hide ?? 'dissolve';

  const reform = useCallback(async () => {
    const el = ref.current;
    if (!engine || !el || !onScreen.current || !activeRef.current) return;
    const id = ++request.current;
    const placed = await buildRef.current(el);
    if (!placed || id !== request.current || !onScreen.current || !activeRef.current) return;
    const spawn = emitterRef.current(el.getBoundingClientRect());
    engine.setEmitter(group, engine.viewToWorld(spawn.x, spawn.y));
    const center = engine.viewToWorld(placed.left + placed.width / 2, placed.top + placed.height / 2);
    engine.morph(group, {
      art: placed.art,
      centerX: center.x,
      centerY: center.y,
      width: placed.width,
      height: placed.height,
      color: placed.color,
      density: DENSITY,
      emitter: group,
    });
    setFormed(true);
  }, [engine, group, ref]);

  const vanish = useCallback(() => {
    request.current++;
    if (!engine) return;
    if (hide === 'scatter') engine.scatter(group);
    else engine.dissolve(group);
  }, [engine, group, hide]);

  useEffect(() => {
    const el = ref.current;
    if (!engine || !el) return;
    const pending = request;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting;
      if (entry.isIntersecting && activeRef.current) void reform().catch((err) => console.error(err));
      else vanish();
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
  }, [engine, group, ref, reform, vanish]);

  useEffect(() => {
    if (!onScreen.current) return;
    if (active) void reform().catch((err) => console.error(err));
    else vanish();
  }, [active, reform, vanish]);

  const scatter = useCallback(() => {
    request.current++;
    engine?.scatter(group);
  }, [engine, group]);

  return { group, formed, scatter, reform: () => void reform().catch((err) => console.error(err)) };
}
