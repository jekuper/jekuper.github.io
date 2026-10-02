import { motion } from 'framer-motion';
import { dropIn, onceInView, slideIn } from '../../components/motion';
import type { Layout, StatsData } from '../../content/types';
import { asset } from '../../lib/asset';
import './StatsSection.css';

const STAGGER_S = 0.25;
const ease = 'easeInOut' as const;

export function StatsSection({ data, layout }: { data: StatsData; layout: Layout }) {
  const desktop = layout === 'desktop';
  return (
    <div className="stats">
      <div className="widget-wrapper">
        {data.stats.map((stat, i) => (
          <div key={stat.label} className="widget">
            <motion.h1 {...dropIn(i * STAGGER_S)}>{stat.value}</motion.h1>
            <motion.p {...slideIn(i * STAGGER_S)}>{stat.label}</motion.p>
          </div>
        ))}
      </div>

      <a className="resume-link-a" href={asset(data.moreHref)} target="_blank" rel="noreferrer">
        <motion.div
          initial={{ x: '100%', opacity: 0, ...(desktop && { fontSize: '2vw' }) }}
          whileInView={{ x: 0, opacity: 1 }}
          whileHover={{ color: 'white', ...(desktop && { fontSize: '2.2vw' }) }}
          transition={{
            x: { duration: 1, ease },
            opacity: { duration: 1, ease },
            fontSize: { duration: 0.5, ease },
            color: { duration: 0.5, ease },
          }}
          viewport={onceInView}
          className="resume-link"
        >
          {data.moreLabel}
          <div className="skill-underline" />
        </motion.div>
      </a>
    </div>
  );
}
