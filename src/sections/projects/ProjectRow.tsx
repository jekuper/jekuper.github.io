import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { slideIn } from '../../components/motion';
import type { Layout, Project } from '../../content/types';
import { imageToGrid, loadImage, rgb, type LineArt } from '../../engine';
import { useFinePointer } from '../../hooks/useMediaQuery';
import { track } from '../../lib/analytics';
import { asset } from '../../lib/asset';
import { useViewMorph } from '../../react/useViewMorph';
import { deviceScale } from '../hero/scene';

// Grid step in CSS pixels, grown until the dot count fits the layout's cap (scaled to the device).
const MIN_STEP = 6;
const MAX_DOTS: Record<Layout, number> = { desktop: 7000, mobile: 2500 };
// On touch screens the image shows by itself once the card has sat mid-screen this long.
const REVEAL_DELAY_MS = 1800;
const CENTER_BAND = '-30% 0px -30% 0px';
// Dots are drawn as round tiles this fraction of the grid step, so the picture keeps its brightness.
const MOSAIC_DOT = 0.8;
const SKETCH_COLOR = rgb(190, 190, 190);
// True colors and each cell's brightest pixel: dim glows stay dim and thin bright details survive.
// Only near-black cells are skipped, since they would be invisible on the page anyway.
const DEFAULT_TUNING = { sample: 'peak', minLuminance: 6, minBrightness: 0 } as const;

const sketches = new Map<string, Promise<LineArt>>();

type Tuning = Project['sketchTuning'];

function sketch(url: string, width: number, height: number, step: number, tuning: Tuning): Promise<LineArt> {
  const key = `${url}|${Math.round(width)}x${Math.round(height)}|${step}|${JSON.stringify(tuning ?? {})}`;
  let pending = sketches.get(key);
  if (!pending) {
    pending = loadImage(url).then((img) => imageToGrid(img, { width, height, step, order: 'dots', ...DEFAULT_TUNING, ...tuning }));
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

/**
 * A project with a dot grid of its screenshot. With a mouse, hovering scatters the
 * dots and shows the image; on touch screens that happens when the card sits mid-screen.
 */
export function ProjectRow({ project, index, layout }: ProjectRowProps) {
  const visual = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  const touch = !useFinePointer();

  const { scatter, reform } = useViewMorph(visual, async (el) => {
    const rect = el.getBoundingClientRect();
    const maxDots = MAX_DOTS[layout] * deviceScale(layout);
    const step = Math.max(MIN_STEP, Math.sqrt((rect.width * rect.height) / maxDots));
    // Loose dots, not linked lines: they read as a picture at any size.
    const grid = await sketch(asset(project.image), rect.width, rect.height, step, project.sketchTuning);
    const art = { ...grid, sizes: new Float32Array(grid.pointCount).fill(step * MOSAIC_DOT), round: true };
    return { art, left: rect.left, top: rect.top, width: rect.width, height: rect.height, color: SKETCH_COLOR };
  });

  const reveal = (show: boolean) => {
    if (show === revealed) return;
    setRevealed(show);
    if (show) {
      track('project-reveal', { project: project.title });
      scatter();
    } else {
      reform();
    }
  };

  const scatterRef = useRef(scatter);
  scatterRef.current = scatter;
  useEffect(() => {
    const el = visual.current;
    if (!touch || !el) return;
    let timer = 0;
    const center = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        if (!entry.isIntersecting || revealedRef.current) return;
        timer = window.setTimeout(() => {
          setRevealed(true);
          scatterRef.current();
        }, REVEAL_DELAY_MS);
      },
      { rootMargin: CENTER_BAND },
    );
    // Off screen the dots go back to the emitter, so the next visit starts from the sketch again.
    const screen = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setRevealed(false);
    });
    center.observe(el);
    screen.observe(el);
    return () => {
      window.clearTimeout(timer);
      center.disconnect();
      screen.disconnect();
    };
  }, [touch]);

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
        <span className="project-index">
          {String(index + 1).padStart(2, '0')}
          <span className="project-year">{project.year}</span>
        </span>
        <h3>{project.title}</h3>
        <p className="project-description">{project.description}</p>
        <p className="project-details">{project.details}</p>
        <div className="project-links">
          {project.links.map((link) => (
            <a
              key={link.href}
              className="project-link"
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('project-link', { project: project.title, link: link.label })}
            >
              {link.label}
              <span className="skill-underline" />
            </a>
          ))}
        </div>
      </motion.div>
    </article>
  );
}
