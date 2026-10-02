import type { LineArt } from './art';

// Edges of a marching squares cell.
const T = 0;
const R = 1;
const B = 2;
const L = 3;

// Segments per cell case; bits are top-left 8, top-right 4, bottom-right 2, bottom-left 1.
const CASES: number[][] = [
  [],
  [L, B],
  [B, R],
  [L, R],
  [T, R],
  [L, B, T, R],
  [T, B],
  [T, L],
  [T, L],
  [T, B],
  [T, L, B, R],
  [T, R],
  [L, R],
  [R, B],
  [L, B],
  [],
];

/**
 * Closed outlines (outer edges and holes) of a binary mask, as flat x, y arrays
 * in pixel units. Pixels outside the mask count as empty, so every loop closes.
 */
export function traceMask(mask: Uint8Array, width: number, height: number): Float32Array[] {
  const stride = width + 2;
  const ids = stride * (height + 2) * 2;
  const nbA = new Int32Array(ids).fill(-1);
  const nbB = new Int32Array(ids).fill(-1);
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] ? 1 : 0);
  const connect = (a: number, b: number) => {
    if (nbA[a] === -1) nbA[a] = b;
    else nbB[a] = b;
    if (nbA[b] === -1) nbA[b] = a;
    else nbB[b] = a;
  };

  for (let cy = -1; cy < height; cy++) {
    for (let cx = -1; cx < width; cx++) {
      const index = at(cx, cy) * 8 + at(cx + 1, cy) * 4 + at(cx + 1, cy + 1) * 2 + at(cx, cy + 1);
      const segments = CASES[index];
      if (segments.length === 0) continue;
      const row = (cy + 1) * stride + (cx + 1);
      const edge = [row * 2, (row + 1) * 2 + 1, (row + stride) * 2, row * 2 + 1];
      for (let s = 0; s < segments.length; s += 2) connect(edge[segments[s]], edge[segments[s + 1]]);
    }
  }

  const visited = new Uint8Array(ids);
  const loops: Float32Array[] = [];
  const xs: number[] = [];
  for (let start = 0; start < ids; start++) {
    if (nbA[start] === -1 || visited[start]) continue;
    xs.length = 0;
    let prev = -1;
    let cur = start;
    do {
      visited[cur] = 1;
      const k = cur >> 1;
      const col = (k % stride) - 1;
      const row = Math.floor(k / stride) - 1;
      // Even ids sit on horizontal edges, odd ids on vertical ones.
      if (cur & 1) xs.push(col, row + 0.5);
      else xs.push(col + 0.5, row);
      const next = nbA[cur] !== prev ? nbA[cur] : nbB[cur];
      prev = cur;
      cur = next;
    } while (cur !== start && cur !== -1);
    loops.push(Float32Array.from(xs));
  }
  return loops;
}

export function loopLength(loop: Float32Array): number {
  let total = 0;
  const n = loop.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    total += Math.hypot(loop[j * 2] - loop[i * 2], loop[j * 2 + 1] - loop[i * 2 + 1]);
  }
  return total;
}

/** Points spaced `spacing` apart along a closed loop. */
export function resampleLoop(loop: Float32Array, spacing: number): Float32Array {
  const n = loop.length / 2;
  const count = Math.max(1, Math.round(loopLength(loop) / spacing));
  const step = loopLength(loop) / count;
  const out = new Float32Array(count * 2);
  let written = 0;
  let carry = 0;
  for (let i = 0; i < n && written < count; i++) {
    const j = (i + 1) % n;
    const ax = loop[i * 2];
    const ay = loop[i * 2 + 1];
    const dx = loop[j * 2] - ax;
    const dy = loop[j * 2 + 1] - ay;
    const len = Math.hypot(dx, dy);
    let d = carry;
    while (d < len && written < count) {
      out[written * 2] = ax + (dx * d) / len;
      out[written * 2 + 1] = ay + (dy * d) / len;
      written++;
      d += step;
    }
    carry = d - len;
  }
  return out.subarray(0, written * 2);
}

/**
 * Builds a line art from flat x, y contours. Single-point contours are allowed
 * and draw as lone dots. Coordinates are shifted so the minimum is 0; the shift
 * is returned as `offsetX`, `offsetY`.
 */
export function artFromContours(
  contours: Float32Array[],
  colors?: Uint8Array[],
): LineArt & { offsetX: number; offsetY: number } {
  let pointCount = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of contours) {
    pointCount += c.length / 2;
    for (let i = 0; i < c.length; i += 2) {
      minX = Math.min(minX, c[i]);
      maxX = Math.max(maxX, c[i]);
      minY = Math.min(minY, c[i + 1]);
      maxY = Math.max(maxY, c[i + 1]);
    }
  }
  if (pointCount === 0) minX = minY = maxX = maxY = 0;

  const starts = new Uint32Array(contours.length + 1);
  const x = new Float32Array(pointCount);
  const y = new Float32Array(pointCount);
  const rgb = new Uint8Array(pointCount * 3);
  let p = 0;
  contours.forEach((c, k) => {
    starts[k] = p;
    if (colors) rgb.set(colors[k], p * 3);
    for (let i = 0; i < c.length; i += 2, p++) {
      x[p] = c[i] - minX;
      y[p] = c[i + 1] - minY;
    }
  });
  starts[contours.length] = p;

  return {
    starts,
    x,
    y,
    rgb,
    pointCount,
    contourCount: contours.length,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    offsetX: minX,
    offsetY: minY,
  };
}
