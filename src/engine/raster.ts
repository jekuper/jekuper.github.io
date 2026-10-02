import type { LineArt } from './art';
import type { Rgb } from './math';
import { artFromContours, loopLength, resampleLoop, traceMask } from './trace';

const ALPHA_THRESHOLD = 128;
const HATCH_MARGIN = 1.5;

export interface TextArtOptions {
  /** CSS font shorthand, e.g. from getComputedStyle. */
  font: string;
  letterSpacing?: string;
  /** Distance between outline dots, CSS pixels. */
  spacing: number;
  /** Gap between diagonal hatch lines inside the glyphs; 0 draws outlines only. */
  fill?: number;
  /** Upper bound on dots; spacing grows to stay under it. */
  maxPoints?: number;
  /** Rasterization oversampling for smoother outlines. */
  oversample?: number;
}

export interface TextArt {
  art: LineArt;
  /** Art top-left relative to the pen position (text start, baseline). */
  offsetX: number;
  offsetY: number;
  /** Advance width and font ascent / descent, CSS pixels. */
  advance: number;
  ascent: number;
  descent: number;
}

function context2d(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return canvas.getContext('2d', { willReadFrequently: true })!;
}

/** Dots along the outline of rendered text, optionally hatched inside with diagonal lines. */
export function textToArt(text: string, options: TextArtOptions): TextArt {
  const scale = options.oversample ?? 2;
  const probe = context2d(1, 1);
  probe.font = options.font;
  if (options.letterSpacing) probe.letterSpacing = options.letterSpacing;
  const m = probe.measureText(text);
  const ascent = m.fontBoundingBoxAscent;
  const descent = m.fontBoundingBoxDescent;
  const pad = Math.ceil((ascent + descent) * 0.1);
  const width = m.width + pad * 2;
  const height = ascent + descent + pad * 2;

  const ctx = context2d(width * scale, height * scale);
  ctx.scale(scale, scale);
  ctx.font = options.font;
  if (options.letterSpacing) ctx.letterSpacing = options.letterSpacing;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, pad, pad + ascent);

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const pixels = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4 + 3] >= ALPHA_THRESHOLD ? 1 : 0;

  const loops = traceMask(mask, w, h).map((loop) => loop.map((v) => v / scale));
  let spacing = options.spacing;
  const perimeter = loops.reduce((sum, loop) => sum + loopLength(loop), 0);
  if (options.maxPoints) spacing = Math.max(spacing, perimeter / options.maxPoints);
  const contours = loops.filter((loop) => loopLength(loop) >= spacing * 3).map((loop) => resampleLoop(loop, spacing));
  const open = contours.map(() => false);

  const hatch = options.fill ?? 0;
  if (hatch > 0) {
    // A sample counts as inside only with some margin, so hatch lines stop short of the outline.
    const margin = HATCH_MARGIN;
    const inside = (x: number, y: number) =>
      [
        [0, 0],
        [margin, 0],
        [-margin, 0],
        [0, margin],
        [0, -margin],
      ].every(([dx, dy]) => {
        const px = Math.floor((x + dx) * scale);
        const py = Math.floor((y + dy) * scale);
        return px >= 0 && py >= 0 && px < w && py < h && mask[py * w + px] === 1;
      });
    // Lines x + y = c, rising left to right; c steps so the lines sit `hatch` apart.
    const step = spacing / Math.SQRT2;
    for (let c = hatch; c < width + height; c += hatch * Math.SQRT2) {
      let run: number[] = [];
      const flush = () => {
        if (run.length >= 4) {
          contours.push(Float32Array.from(run));
          open.push(true);
        }
        run = [];
      };
      for (let x = Math.max(0, c - height); x <= Math.min(width, c); x += step) {
        const y = c - x;
        if (inside(x, y)) run.push(x, y);
        else flush();
      }
      flush();
    }
  }

  const art = artFromContours(contours, undefined, open);
  return {
    art,
    offsetX: art.offsetX - pad,
    offsetY: art.offsetY - pad - ascent,
    advance: m.width,
    ascent,
    descent,
  };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  return img.decode().then(() => img);
}

/** How grid dots are chained into lines. `dots` draws no lines. */
export type GridOrder = 'rows' | 'columns' | 'diagonal' | 'spiral' | 'dots';

export interface GridOptions {
  /** Output size in CSS pixels; the image is cropped to cover it. */
  width: number;
  height: number;
  /** Grid step in CSS pixels. */
  step: number;
  order: GridOrder;
  /** Cells darker than this are left out, so dark areas stay empty. */
  minLuminance?: number;
  /** Cells more transparent than this are left out (0-255), e.g. a cut-out background. */
  minAlpha?: number;
  /** Channels are brightened until the strongest reaches this. */
  minBrightness?: number;
}

/** Cell visiting order for each `GridOrder`, as [column, row] pairs. */
function gridPath(cols: number, rows: number, order: GridOrder): [number, number][] {
  const path: [number, number][] = [];
  if (order === 'columns') {
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) path.push([x, y]);
  } else if (order === 'diagonal') {
    for (let d = 0; d < cols + rows - 1; d++) {
      for (let x = Math.max(0, d - rows + 1); x <= Math.min(d, cols - 1); x++) path.push([x, d - x]);
    }
  } else if (order === 'spiral') {
    let left = 0;
    let top = 0;
    let right = cols - 1;
    let bottom = rows - 1;
    while (left <= right && top <= bottom) {
      for (let x = left; x <= right; x++) path.push([x, top]);
      for (let y = top + 1; y <= bottom; y++) path.push([right, y]);
      if (top < bottom) for (let x = right - 1; x >= left; x--) path.push([x, bottom]);
      if (left < right) for (let y = bottom - 1; y > top; y--) path.push([left, y]);
      left++;
      top++;
      right--;
      bottom--;
    }
  } else {
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) path.push([x, y]);
  }
  return path;
}

/**
 * Samples an image on a grid, one dot per cell in the cell's average color,
 * and chains neighbouring dots into lines following `order`.
 */
export function imageToGrid(image: CanvasImageSource & { width: number; height: number }, options: GridOptions): LineArt {
  const { width, height, step } = options;
  const cols = Math.max(1, Math.floor(width / step));
  const rows = Math.max(1, Math.floor(height / step));
  // Drawing straight into a cols x rows canvas averages each cell for us.
  const ctx = context2d(cols, rows);
  ctx.imageSmoothingQuality = 'high';
  const cover = Math.max(cols / image.width, rows / image.height);
  const dw = image.width * cover;
  const dh = image.height * cover;
  ctx.drawImage(image, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
  const px = ctx.getImageData(0, 0, cols, rows).data;

  const minLuminance = options.minLuminance ?? 22;
  const minAlpha = options.minAlpha ?? 128;
  const minBrightness = options.minBrightness ?? 120;
  const offsetX = (width - cols * step) / 2 + step / 2;
  const offsetY = (height - rows * step) / 2 + step / 2;

  const contours: Float32Array[] = [];
  const colors: Uint8Array[] = [];
  const open: boolean[] = [];
  let xs: number[] = [];
  let rgb: number[] = [];
  const flush = () => {
    if (xs.length === 0) return;
    contours.push(Float32Array.from(xs));
    colors.push(Uint8Array.from(rgb));
    open.push(true);
    xs = [];
    rgb = [];
  };

  let prev: [number, number] | null = null;
  for (const cell of gridPath(cols, rows, options.order)) {
    const [x, y] = cell;
    const o = (y * cols + x) * 4;
    let r = px[o];
    let g = px[o + 1];
    let b = px[o + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const skip = luminance < minLuminance || px[o + 3] < minAlpha;
    const adjacent = prev !== null && Math.abs(prev[0] - x) <= 1 && Math.abs(prev[1] - y) <= 1;
    if (skip || !adjacent || options.order === 'dots') flush();
    prev = cell;
    if (skip) continue;
    const peak = Math.max(r, g, b, 1);
    if (peak < minBrightness) {
      const boost = minBrightness / peak;
      r = Math.min(255, r * boost + 1);
      g = Math.min(255, g * boost + 1);
      b = Math.min(255, b * boost + 1);
    }
    xs.push(offsetX + x * step, offsetY + y * step);
    rgb.push(r, g, b);
  }
  flush();

  // Pin the bounds to the full box so placement does not depend on which cells were kept.
  contours.push(new Float32Array([0, 0]), new Float32Array([width - 1, height - 1]));
  colors.push(new Uint8Array([1, 1, 1]), new Uint8Array([1, 1, 1]));
  open.push(true, true);
  return artFromContours(contours, colors, open);
}

export interface HalftoneOptions {
  /** Output size in CSS pixels; the image is cropped to cover it. */
  width: number;
  height: number;
  /** Grid step in CSS pixels. */
  step: number;
  /** Colors for the darkest and lightest tones. */
  dark: Rgb;
  light: Rgb;
  /** Dot diameter range as fractions of the step. */
  minDot?: number;
  maxDot?: number;
  /** Cells more transparent than this are left out (0-255). */
  minAlpha?: number;
}

/**
 * Halftone: one round dot per grid cell, sized by brightness and by opacity,
 * so cut-out edges thin out instead of ending in a hard line.
 */
export function imageToHalftone(image: CanvasImageSource & { width: number; height: number }, options: HalftoneOptions): LineArt {
  const { width, height, step, dark, light } = options;
  const cols = Math.max(1, Math.floor(width / step));
  const rows = Math.max(1, Math.floor(height / step));
  const ctx = context2d(cols, rows);
  ctx.imageSmoothingQuality = 'high';
  const cover = Math.max(cols / image.width, rows / image.height);
  const dw = image.width * cover;
  const dh = image.height * cover;
  ctx.drawImage(image, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
  const px = ctx.getImageData(0, 0, cols, rows).data;

  const minAlpha = options.minAlpha ?? 24;
  const minDot = options.minDot ?? 0.18;
  const maxDot = options.maxDot ?? 1.05;

  // Stretch the visible tones to the full range so a flat photo still has contrast.
  let lo = 255;
  let hi = 0;
  for (let i = 0; i < cols * rows; i++) {
    if (px[i * 4 + 3] < minAlpha) continue;
    const l = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    lo = Math.min(lo, l);
    hi = Math.max(hi, l);
  }
  const range = Math.max(1, hi - lo);

  const contours: Float32Array[] = [];
  const colors: Uint8Array[] = [];
  const sizes: number[] = [];
  const offsetX = (width - cols * step) / 2 + step / 2;
  const offsetY = (height - rows * step) / 2 + step / 2;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const o = (y * cols + x) * 4;
      const a = px[o + 3];
      if (a < minAlpha) continue;
      const t = (0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2] - lo) / range;
      const size = step * (minDot + (maxDot - minDot) * t) * (a / 255);
      if (size < 0.6) continue;
      contours.push(new Float32Array([offsetX + x * step, offsetY + y * step]));
      // Red at least 1: an all-zero color means "use the group color".
      colors.push(
        new Uint8Array([
          Math.max(1, dark.r + (light.r - dark.r) * t),
          dark.g + (light.g - dark.g) * t,
          dark.b + (light.b - dark.b) * t,
        ]),
      );
      sizes.push(size);
    }
  }

  // Zero-size pins keep the bounds at the full box.
  contours.push(new Float32Array([0, 0]), new Float32Array([width - 1, height - 1]));
  colors.push(new Uint8Array([1, 1, 1]), new Uint8Array([1, 1, 1]));
  sizes.push(0, 0);
  const art = artFromContours(contours, colors);
  return { ...art, sizes: Float32Array.from(sizes), round: true };
}
