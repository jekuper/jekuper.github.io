import { useRef, useState } from 'react';
import type { Layout } from '../../content/types';
import { imageToGrid, loadImage, rgb } from '../../engine';
import { asset } from '../../lib/asset';
import { useViewMorph } from '../../react/useViewMorph';

const STEP: Record<Layout, number> = { desktop: 6, mobile: 6 };
const COLOR = rgb(200, 200, 200);

/** The photo as a dot grid; hovering (or tapping) scatters the dots and shows the photo. */
export function Portrait({ src, alt, layout }: { src: string; alt: string; layout: Layout }) {
  const box = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const touch = layout === 'mobile';

  const { scatter, reform } = useViewMorph(box, async (el) => {
    const rect = el.getBoundingClientRect();
    const image = await loadImage(asset(src));
    // Dark hair and clothes stay in: brightened instead of dropped. The cut-out background is skipped.
    const art = imageToGrid(image, {
      width: rect.width,
      height: rect.height,
      step: STEP[layout],
      order: 'rows',
      minLuminance: 0,
      minAlpha: 140,
      minBrightness: 90,
    });
    return { art, left: rect.left, top: rect.top, width: rect.width, height: rect.height, color: COLOR };
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
