import { motion } from 'framer-motion';
import { useRef } from 'react';
import { onceInView, riseIn } from '../../components/motion';
import { SplitText } from '../../components/Text';
import type { SkillCategory, SkillsData } from '../../content/types';
import { rgb } from '../../engine';
import { useViewMorph } from '../../react/useViewMorph';
import { buildConstellation } from './constellation';
import './SkillsSection.css';

const PALETTE = [rgb(92, 107, 209), rgb(240, 83, 101), rgb(239, 117, 102), rgb(190, 190, 190)];
const EMITTER_GAP = 28;

export function SkillsSection({ data }: { data: SkillsData }) {
  return (
    <div className="section skill-section">
      <motion.h1 {...riseIn(0)} className="section-title">
        <SplitText value={data.title} />
      </motion.h1>
      <div className="skill-grid">
        {data.categories.map((category, i) => (
          <SkillColumn key={category.name} category={category} index={i} />
        ))}
      </div>
    </div>
  );
}

/** Plain, readable list; the engine draws a circuit of dots along its markers. */
function SkillColumn({ category, index }: { category: SkillCategory; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useViewMorph(ref, async (el) => buildConstellation(el, PALETTE[index % PALETTE.length]), {
    emitter: () => {
      const last = ref.current?.querySelector('li:last-child .skill-node')?.getBoundingClientRect();
      return last ? { x: last.left + last.width / 2, y: last.bottom + EMITTER_GAP } : { x: 0, y: 0 };
    },
  });

  // Fades only: a moving column would be measured mid-animation.
  return (
    <motion.div
      ref={ref}
      className="skill-category"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      viewport={onceInView}
    >
      <div className="skill-category-head">
        <span className="skill-node skill-node--head" />
        <h3>{category.name}</h3>
      </div>
      <ul>
        {category.items.map((item) => (
          <li key={item}>
            <span className="skill-node" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
