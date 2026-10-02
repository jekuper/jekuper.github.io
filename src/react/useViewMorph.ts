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
  /** IntersectionObserver margin, e.g. to form only once well inside the screen. */
  rootMargin?: string;
  /** Named clip region the dots are drawn inside. */
  clip?: string;
  /** Draw the emitter bar; off for small elements where it would sit on nearby text. */
  showEmitter?: boolean;
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
  const rootMargin = options.rootMargin ?? '0px';
  const clipRef = useRef(options.clip);
  clipRef.current = options.clip;
  const showEmitterRef = useRef(options.showEmitter ?? true);
  showEmitterRef.current = options.showEmitter ?? true;
  /** World position of the element's corner when the group was placed; null while not formed. */
  const anchor = useRef<Point | null>(null);

  const reform = useCallback(async () => {
    const el = ref.current;
    if (!engine || !el || !onScreen.current || !activeRef.current) return;
    const id = ++request.current;
    const placed = await buildRef.current(el);
    if (!placed || id !== request.current || !onScreen.current || !activeRef.current) return;
    const spawn = emitterRef.current(el.getBoundingClientRect());
    engine.setEmitter(group, engine.viewToWorld(spawn.x, spawn.y), showEmitterRef.current);
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
      clip: clipRef.current,
    });
    const rect = el.getBoundingClientRect();
    anchor.current = engine.viewToWorld(rect.left, rect.top);
    setFormed(true);
  }, [engine, group, ref]);

  const vanish = useCallback(() => {
    request.current++;
    anchor.current = null;
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
    }, { rootMargin });
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
  }, [engine, group, ref, reform, vanish, rootMargin]);

  useEffect(() => {
    if (!onScreen.current) return;
    if (active) void reform().catch((err) => console.error(err));
    else vanish();
  }, [active, reform, vanish]);

  // Over a pinned stretch of the world the element scrolls but the world does not; follow it.
  useEffect(() => {
    if (!engine) return;
    let frame = 0;
    const follow = () => {
      frame = 0;
      const el = ref.current;
      if (!el || !anchor.current) return;
      const rect = el.getBoundingClientRect();
      const now = engine.viewToWorld(rect.left, rect.top);
      const dx = now.x - anchor.current.x;
      const dy = now.y - anchor.current.y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      engine.moveGroup(group, dx, dy);
      const spawn = emitterRef.current(rect);
      engine.setEmitter(group, engine.viewToWorld(spawn.x, spawn.y), showEmitterRef.current);
      anchor.current = now;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(follow);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [engine, group, ref]);

  const scatter = useCallback(() => {
    request.current++;
    anchor.current = null;
    engine?.scatter(group);
  }, [engine, group]);

  return { group, formed, scatter, reform: () => void reform().catch((err) => console.error(err)) };
}
