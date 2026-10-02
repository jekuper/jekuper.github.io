import { motion } from 'framer-motion';
import { useState } from 'react';
import { onceInView } from '../../components/motion';
import { SplitText } from '../../components/Text';
import type { Layout, ProjectsData } from '../../content/types';
import { Carousel } from './Carousel';
import './ProjectsSection.css';

const IDLE_COLOR = '#A6A6A6';
const FOCUS_COLOR = '#5E5C5C';

export function ProjectsSection({ data, layout }: { data: ProjectsData; layout: Layout }) {
  const [focused, setFocused] = useState(false);
  const desktop = layout === 'desktop';

  // The title shrinks out of the way while a slide is expanded.
  const idle = desktop ? { fontSize: '4vw', marginBottom: '0', color: IDLE_COLOR } : { color: IDLE_COLOR };
  const focus = desktop ? { fontSize: '2.7vw', marginBottom: '4vh', color: FOCUS_COLOR } : { color: FOCUS_COLOR };

  return (
    <div className="section-projects">
      <motion.div
        initial={{ y: 50, opacity: 0, ...(desktop ? idle : { marginBottom: '20vh', color: IDLE_COLOR }) }}
        whileInView={{ y: 0, opacity: 1 }}
        animate={focused ? focus : idle}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        viewport={onceInView}
        className="section-title"
      >
        <SplitText value={data.title} hardBreak={!desktop} />
      </motion.div>
      <Carousel projects={data.projects} touch={!desktop} onFocusChange={setFocused} />
    </div>
  );
}
