import { motion } from 'framer-motion';
import { useRef } from 'react';
import { onceInView, riseIn } from '../../components/motion';
import type { JourneyData, Layout, Milestone } from '../../content/types';
import { useTheme } from '../../app/themeContext';
import { rgb, type Point, type Rgb } from '../../engine';
import { ring, shapesToArt, trace, type Shape } from '../../lib/dotPaths';
import { useViewMorph, type ViewArt } from '../../react/useViewMorph';
import './JourneySection.css';

const PATH_COLOR = rgb(170, 170, 170);
const NODE_RADIUS = 7;
const INNER_RADIUS = 3;
// Forms once the milestone is a quarter of the way up the screen.
const ROOT_MARGIN = '0px 0px -25% 0px';

function center(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Node rings plus the dotted path back up to the previous milestone, in viewport coordinates. */
function buildStep(row: HTMLElement, nodeColor: Rgb): ViewArt | null {
  const node = row.querySelector('.journey-node');
  if (!node) return null;
  const here = center(node);
  const shapes: Shape[] = [];
  const prevNode = row.previousElementSibling?.querySelector('.journey-node');
  if (prevNode) {
    const from = center(prevNode);
    shapes.push({ points: trace(from.x, from.y + NODE_RADIUS, here.x, here.y - NODE_RADIUS), closed: false, color: PATH_COLOR });
  }
  shapes.push({ points: ring(here.x, here.y, NODE_RADIUS), closed: true, color: nodeColor });
  shapes.push({ points: ring(here.x, here.y, INNER_RADIUS), closed: true, color: nodeColor });
  const art = shapesToArt(shapes);
  return { art, left: art.offsetX, top: art.offsetY, width: art.width, height: art.height, color: PATH_COLOR };
}

function MilestoneRow({ milestone, index }: { milestone: Milestone; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const { accent } = useTheme();
  useViewMorph(ref, async (el) => buildStep(el, accent), {
    rootMargin: ROOT_MARGIN,
    // The path grows out of the previous milestone and retracts into it.
    emitter: () => {
      const prev = ref.current?.previousElementSibling?.querySelector('.journey-node');
      const own = ref.current?.querySelector('.journey-node');
      const at = prev ?? own;
      return at ? center(at) : { x: 0, y: 0 };
    },
  });

  return (
    <li ref={ref} className={`milestone ${index % 2 ? 'milestone--right' : 'milestone--left'}`}>
      <span className="journey-node" />
      <motion.div
        className="milestone-card"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ ...onceInView, margin: ROOT_MARGIN }}
      >
        <span className="milestone-year">{milestone.year}</span>
        <h3>{milestone.title}</h3>
        <p className="milestone-place">{milestone.place}</p>
        <p className="milestone-text">{milestone.text}</p>
      </motion.div>
    </li>
  );
}

export function JourneySection({ data }: { data: JourneyData; layout: Layout }) {
  return (
    <section className="journey">
      <motion.h2 {...riseIn(0)} className="section-title">
        {data.title}
      </motion.h2>
      <ol className="journey-list">
        {data.milestones.map((milestone, i) => (
          <MilestoneRow key={i} milestone={milestone} index={i} />
        ))}
      </ol>
    </section>
  );
}
