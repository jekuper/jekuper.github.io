import { motion } from 'framer-motion';
import { DotText } from '../../components/DotText';
import { slideIn } from '../../components/motion';
import type { StatsData } from '../../content/types';
import './StatsSection.css';

const STAGGER_S = 0.25;

export function StatsSection({ data }: { data: StatsData }) {
  return (
    <div className="stats">
      <div className="widget-wrapper">
        {data.stats.map((stat, i) => (
          <div key={stat.label} className="widget">
            <DotText as="h1" text={stat.value} spacing={3} fill={6} />
            <motion.p {...slideIn(i * STAGGER_S)}>{stat.label}</motion.p>
          </div>
        ))}
      </div>
    </div>
  );
}
