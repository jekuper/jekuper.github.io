import { motion } from 'framer-motion';
import { onceInView, wipeIn } from '../../components/motion';
import { SplitText } from '../../components/Text';
import type { AboutData, Layout } from '../../content/types';
import './AboutSection.css';

const WORD_REPEATS = 4;
const GLASS_PANES = 6;

export function AboutSection({ data, layout }: { data: AboutData; layout: Layout }) {
  const desktop = layout === 'desktop';
  return (
    <div className="section-about">
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
      {data.traits.map((trait, row) => (
        <div key={row} className="background-words">
          {Array.from({ length: WORD_REPEATS }, (_, i) => (
            <p key={i}>{trait}</p>
          ))}
        </div>
      ))}
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
  );
}
