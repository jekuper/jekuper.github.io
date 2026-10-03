import { useRef, useState } from 'react';
import type { Layout } from '../../content/types';
import { imageToHalftone, loadImage, rgb } from '../../engine';
import { useFinePointer } from '../../hooks/useMediaQuery';
import { asset } from '../../lib/asset';
import { useViewMorph } from '../../react/useViewMorph';

const STEP: Record<Layout, number> = { desktop: 7, mobile: 6 };
const DARK = rgb(60, 36, 120);
const LIGHT = rgb(232, 230, 240);

/** The photo as a halftone of round dots; hovering (or tapping) scatters them and shows the photo. */
export function Portrait({ src, alt, layout }: { src: string; alt: string; layout: Layout }) {
  const box = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const touch = !useFinePointer();

  const { scatter, reform } = useViewMorph(box, async (el) => {
    const rect = el.getBoundingClientRect();
    const image = await loadImage(asset(src));
    const art = imageToHalftone(image, { width: rect.width, height: rect.height, step: STEP[layout], dark: DARK, light: LIGHT });
    return { art, left: rect.left, top: rect.top, width: rect.width, height: rect.height, color: LIGHT };
  });

  const reveal = (show: boolean) => {
    if (show === revealed) return;
    setRevealed(show);
    if (show) scatter();
    else reform();
  };

  return (
    <div
      ref={box}
      className="about-portrait"
      onMouseEnter={touch ? undefined : () => reveal(true)}
      onMouseLeave={touch ? undefined : () => reveal(false)}
      onClick={touch ? () => reveal(!revealed) : undefined}
    >
      <img className={revealed ? 'is-visible' : ''} src={asset(src)} alt={alt} />
    </div>
  );
}
