import { motion } from 'framer-motion';
import { useRef } from 'react';
import { onceInView, slideIn, wipeIn } from '../../components/motion';
import { SplitText } from '../../components/Text';
import type { AboutData, Layout } from '../../content/types';
import { rgb } from '../../engine';
import { useGalaxy } from '../../react/useGalaxy';
import { Portrait } from './Portrait';
import './AboutSection.css';

const WORD_REPEATS = 4;
const GLASS_PANES = 6;
const GALAXY_DOTS: Record<Layout, number> = { desktop: 4000, mobile: 1500 };
const GALAXY_COLOR = rgb(170, 160, 225);

export function AboutSection({ data, layout }: { data: AboutData; layout: Layout }) {
  const desktop = layout === 'desktop';
  const stage = useRef<HTMLDivElement>(null);
  useGalaxy(stage, {
    x: desktop ? 0.66 : 0.5,
    y: 0.5,
    radius: desktop ? 0.55 : 0.45,
    count: GALAXY_DOTS[layout],
    magnitude: 1600,
    alpha: 0.6,
    color: GALAXY_COLOR,
  });

  // Child order matters: the word rows are styled with div:nth-of-type, counting the stage as the first div.
  // The glass panes live in the stage so they cover the slogan, not the portrait.
  return (
    <div className="section-about">
      <div ref={stage} className="about-stage">
        <h1>{data.heading}</h1>
        {data.lines.map((line) => (
          <motion.h2 key={line.head} {...wipeIn(0.2, desktop)}>
            <SplitText value={line} />
          </motion.h2>
        ))}
        <motion.div
          initial={{ width: '0' }}
          whileInView={{ width: desktop ? '80vw' : '100vw' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={onceInView}
          className="purple-background"
        >
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
            viewport={onceInView}
          >
            {data.highlight}
          </motion.h2>
        </motion.div>
        {Array.from({ length: GLASS_PANES }, (_, i) => (
          <motion.div
            key={i}
            initial={{ y: '-100%' }}
            whileInView={{ y: 0 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            viewport={onceInView}
            className="blur"
          />
        ))}
      </div>
      {data.traits.map((trait, row) => (
        <div key={row} className="background-words">
          {Array.from({ length: WORD_REPEATS }, (_, i) => (
            <p key={i}>{trait}</p>
          ))}
        </div>
      ))}
      <div className="about-profile">
        <Portrait src={data.portrait} alt={data.portraitAlt} layout={layout} />
        <motion.div {...slideIn(0.2)} className="about-bio">
          {data.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
