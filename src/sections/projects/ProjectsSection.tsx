import { motion } from 'framer-motion';
import { riseIn } from '../../components/motion';
import { SplitText } from '../../components/Text';
import type { Layout, ProjectsData } from '../../content/types';
import { ProjectRow } from './ProjectRow';
import './ProjectsSection.css';

export function ProjectsSection({ data, layout }: { data: ProjectsData; layout: Layout }) {
  return (
    <div className="section-projects">
      <motion.div {...riseIn(0)} className="section-title">
        <SplitText value={data.title} hardBreak={layout === 'mobile'} />
      </motion.div>
      {data.projects.map((project, i) => (
        <ProjectRow key={project.title} project={project} index={i} layout={layout} />
      ))}
    </div>
  );
}
