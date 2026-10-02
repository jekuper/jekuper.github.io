import { useEffect, useRef, type Ref } from 'react';
import { DotText } from '../../components/DotText';
import type { Identity, Layout } from '../../content/types';
import { rgb } from '../../engine';
import { asset } from '../../lib/asset';

const ARROW_FADE_PX = 100;
const NAME_COLOR = rgb(235, 235, 235);

interface HeroTitleProps {
  identity: Identity;
  layout: Layout;
  hidden: boolean;
  ref?: Ref<HTMLDivElement>;
  wrapperRef?: Ref<HTMLDivElement>;
}

export function HeroTitle({ identity, layout, hidden, ref, wrapperRef }: HeroTitleProps) {
  const arrow = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (arrow.current) arrow.current.style.opacity = String(Math.max(1 - window.scrollY / ARROW_FADE_PX, 0));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={ref} className={`hero-title ${hidden ? 'off' : 'on'}`}>
      <div ref={wrapperRef} className="title-wrapper">
        {/* The name exists once, drawn in dots; it explodes when the header takes over. */}
        <DotText as="h1" className="h1-title" text={identity.name} spacing={2.5} color={NAME_COLOR} active={!hidden} hide="scatter" />
        <h2 className="occupation-title">{identity.title}</h2>
      </div>
      {layout === 'desktop' && <img ref={arrow} className="title-arrow" src={asset('images/ui/chevron-down.png')} alt="" />}
    </div>
  );
}
