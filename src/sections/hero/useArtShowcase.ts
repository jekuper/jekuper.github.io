import { useCallback, useRef } from 'react';
import { fitArt, loadLineArt } from '../../engine';
import { useLayout } from '../../hooks/useMediaQuery';
import { useEngine } from '../../react/engineContext';
import { ArtDeck } from './artDeck';
import { ART_DENSITY, HERO_EMITTER, HERO_GROUP, pickColor, SCENES } from './scene';

/** Morphs the hero dots into the next line art, or lets them go. */
export function useArtShowcase(): { show: () => void; hide: () => void } {
  const engine = useEngine();
  const layout = useLayout();
  const deck = useRef<ArtDeck>(null);
  const request = useRef(0);

  const show = useCallback(async () => {
    if (!engine) return;
    deck.current ??= new ArtDeck();
    const id = ++request.current;
    const art = await loadLineArt(await deck.current.next());
    // A newer click wins over a slower load.
    if (id !== request.current) return;

    const preset = SCENES[layout];
    const { width: w, height: h } = engine.size;
    const size = fitArt(art, preset.art.width * w, preset.art.height * h);
    engine.morph(HERO_GROUP, {
      art,
      centerX: preset.art.x * w,
      centerY: preset.art.y * h,
      width: size.width,
      height: size.height,
      color: pickColor(preset),
      density: ART_DENSITY,
      emitter: HERO_EMITTER,
    });
    void loadLineArt(await deck.current.peek());
  }, [engine, layout]);

  const hide = useCallback(() => {
    request.current++;
    engine?.release(HERO_GROUP);
  }, [engine]);

  return {
    show: () => void show().catch((err) => console.error(err)),
    hide,
  };
}
