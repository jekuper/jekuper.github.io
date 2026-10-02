import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Layout } from '../content/types';
import { Engine } from '../engine';
import { useFinePointer } from '../hooks/useMediaQuery';
import { EngineContext } from './engineContext';
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

  useEffect(() => {
    if (!canvas) return;
    let instance: Engine;
    try {
      instance = new Engine(canvas);
    } catch (err) {
      console.error(err);
      return;
    }
    instance.setCamera(() => ({ x: 0, y: Math.max(0, window.scrollY - pinEnd.current) }));
    setEngine(instance);
    return () => {
      instance.dispose();
      setEngine(null);
    };
  }, [canvas]);

  useEffect(() => engine?.setInteractive(finePointer), [engine, finePointer]);

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
    </EngineContext.Provider>
  );
}
