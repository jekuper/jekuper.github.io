import { motion } from 'framer-motion';
import { useRef } from 'react';
import { onceInView, slideIn, wipeIn } from '../../components/motion';
import { SplitText } from '../../components/Text';
import type { AboutData, Layout } from '../../content/types';
import { useTheme } from '../../app/themeContext';
import { useGalaxy } from '../../react/useGalaxy';
import { EducationCard } from './EducationCard';
import { Portrait } from './Portrait';
import './AboutSection.css';

const WORD_REPEATS = 4;
const GLASS_PANES = 6;
const GALAXY_DOTS: Record<Layout, number> = { desktop: 4000, mobile: 1500 };

export function AboutSection({ data, layout }: { data: AboutData; layout: Layout }) {
  const desktop = layout === 'desktop';
  const stage = useRef<HTMLDivElement>(null);
  const { soft } = useTheme();
  useGalaxy(stage, {
    x: desktop ? 0.66 : 0.5,
    y: 0.5,
    radius: 0.45,
    count: GALAXY_DOTS[layout],
    magnitude: 1600,
    alpha: 0.6,
    color: soft,
  });

  // The word rows and glass panes live in the stage so they cover the slogan, not the portrait.
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
        <div className="about-words" aria-hidden="true">
          {data.traits.map((trait, row) => (
            <div key={row} className="background-words">
              {Array.from({ length: WORD_REPEATS }, (_, i) => (
                <p key={i}>{trait}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="about-profile">
        <Portrait src={data.portrait} alt={data.portraitAlt} layout={layout} />
        <div className="about-text">
          <motion.div {...slideIn(0.2)} className="about-bio">
            {data.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>
          <EducationCard education={data.education} />
        </div>
      </div>
    </div>
  );
}
