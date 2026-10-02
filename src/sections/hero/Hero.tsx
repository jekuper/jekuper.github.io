import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Header } from '../../components/Header';
import type { Layout, Profile } from '../../content/types';
import { Engine } from '../../engine';
import { useFinePointer } from '../../hooks/useMediaQuery';
import { useScrolledPast } from '../../hooks/useScrolledPast';
import { EngineContext } from '../../react/engineContext';
import { CanvasHint } from './CanvasHint';
import { HeroTitle } from './HeroTitle';
import { TouchOverlay } from './TouchOverlay';
import { useHeroScene } from './useHeroScene';
import './Hero.css';

interface HeroProps {
  profile: Profile;
  layout: Layout;
  children: ReactNode;
}

/** The particle canvas with the header, title and the sections drawn over it. */
export function Hero({ profile, layout, children }: HeroProps) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const titleWrapper = useRef<HTMLDivElement>(null);
  const finePointer = useFinePointer();

  useEffect(() => {
    if (!canvas) return;
    const instance = new Engine(canvas);
    instance.setEmitterAnchor(() => {
      if (!anchor.current) return null;
      const a = anchor.current.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      return { x: a.left + a.width / 2 - c.left, y: a.top + a.height / 2 - c.top };
    });
    setEngine(instance);
    return () => {
      instance.dispose();
      setEngine(null);
    };
  }, [canvas]);

  useEffect(() => engine?.setInteractive(finePointer), [engine, finePointer]);
  useHeroScene(engine, canvas, layout);

  // On mobile the title sits low, so the header follows its text rather than its box.
  const headerVisible = useScrolledPast(layout === 'desktop' ? title : titleWrapper, header);

  return (
    <EngineContext.Provider value={engine}>
      <div className={`hero hero--${layout}`}>
        <div className="hero-backdrop">
          <canvas ref={setCanvas} className="hero-canvas" />
          {layout === 'desktop' && <CanvasHint help={profile.engineHelp} />}
        </div>
        <div ref={anchor} className="emitter-anchor" />
        <Header ref={header} identity={profile.identity} links={profile.links} layout={layout} visible={headerVisible} />
        <div className="hero-content">
          <HeroTitle ref={title} wrapperRef={titleWrapper} identity={profile.identity} layout={layout} hidden={headerVisible} />
          {layout === 'mobile' && <TouchOverlay help={profile.engineHelp} />}
          {children}
        </div>
      </div>
    </EngineContext.Provider>
  );
}
