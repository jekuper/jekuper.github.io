import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { slideIn } from '../../components/motion';
import type { Layout, Project } from '../../content/types';
import { imageToGrid, loadImage, rgb, type GridOrder, type LineArt } from '../../engine';
import { asset } from '../../lib/asset';
import { useViewMorph } from '../../react/useViewMorph';

// Grid step in CSS pixels, grown until the dot count fits the layout's cap.
const MIN_STEP = 6;
const MAX_DOTS: Record<Layout, number> = { desktop: 7000, mobile: 2500 };
const ORDERS: GridOrder[] = ['rows', 'columns', 'diagonal', 'spiral'];
const SKETCH_COLOR = rgb(190, 190, 190);

const sketches = new Map<string, Promise<LineArt>>();

function sketch(url: string, width: number, height: number, step: number, order: GridOrder): Promise<LineArt> {
  const key = `${url}|${Math.round(width)}x${Math.round(height)}|${step}|${order}`;
  let pending = sketches.get(key);
  if (!pending) {
    pending = loadImage(url).then((img) => imageToGrid(img, { width, height, step, order }));
    pending.catch(() => sketches.delete(key));
    sketches.set(key, pending);
  }
  return pending;
}

interface ProjectRowProps {
  project: Project;
  index: number;
  layout: Layout;
}

/** A project with a dot grid of its screenshot; hovering scatters the dots and shows the image. */
export function ProjectRow({ project, index, layout }: ProjectRowProps) {
  const visual = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const touch = layout === 'mobile';

  const { scatter, reform } = useViewMorph(visual, async (el) => {
    const rect = el.getBoundingClientRect();
    const step = Math.max(MIN_STEP, Math.sqrt((rect.width * rect.height) / MAX_DOTS[layout]));
    const order = project.sketch ?? ORDERS[index % ORDERS.length];
    const art = await sketch(asset(project.image), rect.width, rect.height, step, order);
    return { art, left: rect.left, top: rect.top, width: rect.width, height: rect.height, color: SKETCH_COLOR };
  });

  const reveal = (show: boolean) => {
    if (show === revealed) return;
    setRevealed(show);
    if (show) scatter();
    else reform();
  };

  return (
    <article className={`project ${index % 2 ? 'project--flip' : ''}`}>
      <div
        ref={visual}
        className="project-visual"
        onMouseEnter={touch ? undefined : () => reveal(true)}
        onMouseLeave={touch ? undefined : () => reveal(false)}
        onClick={touch ? () => reveal(!revealed) : undefined}
      >
        <img className={revealed ? 'is-visible' : ''} src={asset(project.image)} alt={project.title} loading="lazy" />
      </div>
      <motion.div {...slideIn(0.1)} className="project-info">
        <span className="project-index">{String(index + 1).padStart(2, '0')}</span>
        <h3>{project.title}</h3>
        <p className="project-description">{project.description}</p>
        <p className="project-details">{project.details}</p>
        <a className="project-link" href={project.href} target="_blank" rel="noreferrer">
          {project.linkLabel}
          <span className="skill-underline" />
        </a>
      </motion.div>
    </article>
  );
}
