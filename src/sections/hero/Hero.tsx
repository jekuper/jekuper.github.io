import { useCallback, useRef, type ReactNode, type Ref } from 'react';
import { Header } from '../../components/Header';
import type { Layout, Profile } from '../../content/types';
import { useScrolledPast } from '../../hooks/useScrolledPast';
import { useEngine } from '../../react/engineContext';
import { CanvasHint } from './CanvasHint';
import { HeroTitle } from './HeroTitle';
import { TouchOverlay } from './TouchOverlay';
import { useHeroScene } from './useHeroScene';
import './Hero.css';

interface HeroProps {
  profile: Profile;
  layout: Layout;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** Header, title and the sections drawn over the dot field. */
export function Hero({ profile, layout, children, ref }: HeroProps) {
  const engine = useEngine();
  const root = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const titleWrapper = useRef<HTMLDivElement>(null);

  // Keeps a local handle on the root while still forwarding it to the parent.
  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  useHeroScene(engine, layout, root);

  // On mobile the title sits low, so the header follows its text rather than its box.
  const headerVisible = useScrolledPast(layout === 'desktop' ? title : titleWrapper, header);

  return (
    <div ref={setRoot} className={`hero hero--${layout}`}>
      {layout === 'desktop' && (
        <div className="hero-backdrop">
          <CanvasHint help={profile.engineHelp} />
        </div>
      )}
      <Header ref={header} identity={profile.identity} links={profile.links} layout={layout} visible={headerVisible} />
      <div className="hero-content">
        <HeroTitle ref={title} wrapperRef={titleWrapper} identity={profile.identity} layout={layout} hidden={headerVisible} />
        {layout === 'mobile' && <TouchOverlay help={profile.engineHelp} />}
        {children}
      </div>
    </div>
  );
}
