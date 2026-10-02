import { motion } from 'framer-motion';
import { dropIn, slideIn } from '../../components/motion';
import type { StatsData } from '../../content/types';
import './StatsSection.css';

const STAGGER_S = 0.25;

export function StatsSection({ data }: { data: StatsData }) {
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
    </div>
  );
}
