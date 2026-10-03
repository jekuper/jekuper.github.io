import { motion } from 'framer-motion';
import { useState } from 'react';
import { riseIn, wipeIn } from '../../components/motion';
import { RichText } from '../../components/Text';
import type { IntroData, Layout } from '../../content/types';
import { useFinePointer } from '../../hooks/useMediaQuery';
import { useArtShowcase } from '../hero/useArtShowcase';
import './IntroSection.css';

export function IntroSection({ data, layout }: { data: IntroData; layout: Layout }) {
  const art = useArtShowcase();
  const [showing, setShowing] = useState(false);
  const finePointer = useFinePointer();

  const roll = () => {
    art.show();
    setShowing(true);
  };
  const release = () => {
    art.hide();
    setShowing(false);
  };

  return (
    <div className="section intro-section">
      <motion.h1 {...riseIn(0.5)} className="section-title">
        {data.title}
      </motion.h1>
      <div className="section-left" />
      <div className="section-right">
        <motion.p {...wipeIn(0.5, layout === 'desktop')}>
          <RichText source={finePointer ? data.body : data.touchBody} />
        </motion.p>
        <motion.div {...riseIn(0.8)} className="intro-actions">
          <button type="button" className="intro-button" onClick={roll}>
            {showing ? data.rollAgainLabel : data.rollLabel}
            <span className="skill-underline" />
          </button>
          {showing && (
            <button type="button" className="intro-button intro-button--quiet" onClick={release}>
              {data.releaseLabel}
              <span className="skill-underline" />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
