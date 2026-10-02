import { artFromContours, type Rgb } from '../../engine';
import type { ViewArt } from '../../react/useViewMorph';

const NODE_RADIUS = 4;
const HEAD_RADIUS = 7;
const RING_SPACING = 3.2;
const TRACE_SPACING = 6;

function ring(cx: number, cy: number, r: number): Float32Array {
  const n = Math.max(6, Math.round((2 * Math.PI * r) / RING_SPACING));
  const out = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    out[k * 2] = cx + Math.cos(a) * r;
    out[k * 2 + 1] = cy + Math.sin(a) * r;
  }
  return out;
}

function trace(ax: number, ay: number, bx: number, by: number): Float32Array {
  const len = Math.hypot(bx - ax, by - ay);
  const n = Math.max(2, Math.round(len / TRACE_SPACING) + 1);
  const out = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    out[k * 2] = ax + ((bx - ax) * k) / (n - 1);
    out[k * 2 + 1] = ay + ((by - ay) * k) / (n - 1);
  }
  return out;
}

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

  const contours: Float32Array[] = [];
  const open: boolean[] = [];
  points.forEach((p, i) => {
    contours.push(ring(p.x, p.y, p.radius));
    open.push(false);
    const next = points[i + 1];
    if (!next) return;
    const len = Math.hypot(next.x - p.x, next.y - p.y) || 1;
    const ux = (next.x - p.x) / len;
    const uy = (next.y - p.y) / len;
    contours.push(trace(p.x + ux * p.radius, p.y + uy * p.radius, next.x - ux * next.radius, next.y - uy * next.radius));
    open.push(true);
  });
  const colors = contours.map((c) => {
    const rgb = new Uint8Array((c.length / 2) * 3);
    for (let k = 0; k < rgb.length; k += 3) rgb.set([color.r, color.g, color.b], k);
    return rgb;
  });

  const art = artFromContours(contours, colors, open);
  return { art, left: art.offsetX, top: art.offsetY, width: art.width, height: art.height, color };
}
