import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Layout } from '../content/types';
import { Engine } from '../engine';
import { REDUCED_MOTION_QUERY, useFinePointer, useReducedMotion } from '../hooks/useMediaQuery';
import { EngineContext } from './engineContext';
import { StatsOverlay, statsEnabled } from './StatsOverlay';
import './EngineStage.css';

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
  const pinEnd = useRef(0);
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!canvas) return;
    let instance: Engine;
    try {
      instance = new Engine(canvas);
    } catch (err) {
      console.error(err);
      return;
    }
    // Set before any scene is seeded; children seed in effects that run before ours.
    instance.setReducedMotion(window.matchMedia(REDUCED_MOTION_QUERY).matches);
    instance.setCamera(() => ({ x: 0, y: Math.max(0, window.scrollY - pinEnd.current) }));
    setEngine(instance);
    return () => {
      instance.dispose();
      setEngine(null);
    };
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
      <canvas ref={setCanvas} className="engine-canvas" />
      {children}
      {statsEnabled() && <StatsOverlay />}
    </EngineContext.Provider>
  );
}
