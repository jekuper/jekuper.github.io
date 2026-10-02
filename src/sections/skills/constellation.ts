import type { Rgb } from '../../engine';
import { ring, shapesToArt, trace, type Shape } from '../../lib/dotPaths';
import type { ViewArt } from '../../react/useViewMorph';

const NODE_RADIUS = 4;
const HEAD_RADIUS = 7;

/**
 * A ring of dots on every `.skill-node` in `column`, joined top to bottom by
 * dotted traces, in viewport coordinates.
 */
export function buildConstellation(column: HTMLElement, color: Rgb): ViewArt | null {
  const nodes = [...column.querySelectorAll<HTMLElement>('.skill-node')];
  if (nodes.length === 0) return null;
  const points = nodes.map((node) => {
    const r = node.getBoundingClientRect();
    const radius = node.classList.contains('skill-node--head') ? HEAD_RADIUS : NODE_RADIUS;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, radius };
  });

  const shapes: Shape[] = [];
  points.forEach((p, i) => {
    shapes.push({ points: ring(p.x, p.y, p.radius), closed: true, color });
    const next = points[i + 1];
    if (!next) return;
    const len = Math.hypot(next.x - p.x, next.y - p.y) || 1;
    const ux = (next.x - p.x) / len;
    const uy = (next.y - p.y) / len;
    const line = trace(p.x + ux * p.radius, p.y + uy * p.radius, next.x - ux * next.radius, next.y - uy * next.radius);
    shapes.push({ points: line, closed: false, color });
  });

  const art = shapesToArt(shapes);
  return { art, left: art.offsetX, top: art.offsetY, width: art.width, height: art.height, color };
}
