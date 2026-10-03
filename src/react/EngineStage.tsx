import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Layout } from '../content/types';
import { Engine } from '../engine';
import { REDUCED_MOTION_QUERY, useFinePointer, useReducedMotion } from '../hooks/useMediaQuery';
import { EngineContext } from './engineContext';
import { StatsOverlay, statsEnabled } from './StatsOverlay';
import './EngineStage.css';

/**
 * The canvas is this many viewports tall and scrolls with the page, re-centered
 * on the viewport every frame, so the browser moves it in step with the text.
 * `?overscan=1` keeps a fixed, viewport-sized canvas instead.
 */
const DEFAULT_OVERSCAN = 1.5;

function overscanSetting(): number {
  const requested = Number(new URLSearchParams(window.location.search).get('overscan'));
  return requested >= 1 ? requested : DEFAULT_OVERSCAN;
}

interface EngineStageProps {
  layout: Layout;
  /** While this element fills the screen the world stays put, like a sticky backdrop. */
  pin: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/** One fixed canvas behind the whole page; the camera follows the scroll position. */
export function EngineStage({ layout, pin, children }: EngineStageProps) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [overscan] = useState(overscanSetting);
  const pinEnd = useRef(0);
  const pageHeight = useRef(0);
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!canvas) return;
    let instance: Engine;
    try {
      instance = new Engine(canvas, { overscan });
    } catch (err) {
      console.error(err);
      return;
    }
    // Set before any scene is seeded; children seed in effects that run before ours.
    instance.setReducedMotion(window.matchMedia(REDUCED_MOTION_QUERY).matches);
    instance.setCamera(() => ({ x: 0, y: Math.max(0, window.scrollY - pinEnd.current) }));
    if (overscan > 1) instance.setCanvasOrigin(canvasPlacer(canvas, overscan, () => pinEnd.current, () => pageHeight.current));
    setEngine(instance);
    return () => {
      instance.dispose();
      setEngine(null);
    };
  }, [canvas, overscan]);

  useEffect(() => {
    const root = canvas?.parentElement;
    if (!root) return;
    // The page's own height; the canvas is positioned, so it does not count.
    const observer = new ResizeObserver(() => {
      pageHeight.current = root.offsetHeight;
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [canvas]);

  useEffect(() => engine?.setInteractive(finePointer), [engine, finePointer]);
  useEffect(() => engine?.setReducedMotion(reducedMotion), [engine, reducedMotion]);

  useEffect(() => {
    const measure = () => {
      const el = pin.current;
      pinEnd.current = layout === 'desktop' && el ? Math.max(0, el.offsetTop + el.offsetHeight - window.innerHeight) : 0;
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (pin.current) observer.observe(pin.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pin, layout]);

  return (
    <EngineContext.Provider value={engine}>
      <canvas ref={setCanvas} className="engine-canvas" style={{ height: `${overscan * 100}vh` }} />
      {children}
      {statsEnabled() && <StatsOverlay />}
    </EngineContext.Provider>
  );
}

/**
 * Keeps the viewport inside the canvas and returns the world y of the canvas' top
 * edge. Over the pinned stretch the world stands still, so the canvas is fixed.
 * After it the canvas is part of the page and is only moved, back around the
 * viewport, when the viewport nears one of its edges: a moved canvas and its new
 * picture can reach the screen a frame apart, so moves are kept rare.
 */
function canvasPlacer(canvas: HTMLCanvasElement, overscan: number, pinEnd: () => number, pageHeight: () => number) {
  let top = 0;
  let mode: 'fixed' | 'page' | null = null;
  return (): number => {
    const height = canvas.clientHeight;
    const viewport = height / overscan;
    const margin = (height - viewport) / 2;
    const scroll = window.scrollY;
    const pin = pinEnd();
    if (scroll < pin) {
      if (mode !== 'fixed') {
        mode = 'fixed';
        canvas.style.position = 'fixed';
        canvas.style.transform = `translateY(${-margin}px)`;
      }
      return -margin;
    }
    const nearEdge = scroll - top < margin * 0.25 || top + height - (scroll + viewport) < margin * 0.25;
    if (mode !== 'page' || nearEdge) {
      mode = 'page';
      // Kept inside the page so the canvas never makes it longer; whole device pixels stay sharp.
      const dpr = window.devicePixelRatio || 1;
      const centered = Math.max(0, Math.min(scroll - margin, pageHeight() - height));
      top = Math.round(centered * dpr) / dpr;
      canvas.style.position = 'absolute';
      canvas.style.transform = `translateY(${top}px)`;
    }
    return top - pin;
  };
}
