import type { LineArt } from './art';
import { artFromContours, loopLength, resampleLoop, traceMask } from './trace';

const ALPHA_THRESHOLD = 128;

export interface TextArtOptions {
  /** CSS font shorthand, e.g. from getComputedStyle. */
  font: string;
  letterSpacing?: string;
  /** Distance between outline dots, CSS pixels. */
  spacing: number;
  /** Grid step for dots inside the glyphs; 0 draws outlines only. */
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

/** Dots along the outline (and optionally inside) of rendered text. */
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
  const fillStep = options.fill ?? 0;
  const fill: number[] = [];
  if (fillStep > 0) {
    for (let y = fillStep / 2; y < height; y += fillStep) {
      for (let x = fillStep / 2; x < width; x += fillStep) {
        if (mask[Math.floor(y * scale) * w + Math.floor(x * scale)]) fill.push(x, y);
      }
    }
  }

  let spacing = options.spacing;
  const perimeter = loops.reduce((sum, loop) => sum + loopLength(loop), 0);
  if (options.maxPoints) {
    const outlineBudget = Math.max(1, options.maxPoints - fill.length / 2);
    spacing = Math.max(spacing, perimeter / outlineBudget);
  }
  const contours = loops.filter((loop) => loopLength(loop) >= spacing * 3).map((loop) => resampleLoop(loop, spacing));
  for (let i = 0; i < fill.length; i += 2) contours.push(new Float32Array([fill[i], fill[i + 1]]));

  const art = artFromContours(contours);
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

export interface SketchOptions {
  /** Output size in CSS pixels; the image is cropped to cover it. */
  width: number;
  height: number;
  count: number;
  /** Analysis resolution, longest side in pixels. */
  resolution?: number;
  /** Channels are brightened until the strongest reaches this. */
  minBrightness?: number;
}

/**
 * Pointillist sketch of an image: dots are scattered with a preference for
 * edges and take the color of the pixel under them.
 */
export function imageToSketch(image: CanvasImageSource & { width: number; height: number }, options: SketchOptions): LineArt {
  const resolution = options.resolution ?? 320;
  const ratio = resolution / Math.max(options.width, options.height);
  const sw = Math.max(2, Math.round(options.width * ratio));
  const sh = Math.max(2, Math.round(options.height * ratio));
  const ctx = context2d(sw, sh);
  const cover = Math.max(sw / image.width, sh / image.height);
  const dw = image.width * cover;
  const dh = image.height * cover;
  ctx.drawImage(image, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
  const px = ctx.getImageData(0, 0, sw, sh).data;

  const lum = new Float32Array(sw * sh);
  for (let i = 0; i < lum.length; i++) lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];

  // Sobel magnitude as sampling weight, plus a floor so flat areas still get a few dots.
  const weight = new Float64Array(sw * sh);
  let max = 0;
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const i = y * sw + x;
      const gx = lum[i - sw + 1] + 2 * lum[i + 1] + lum[i + sw + 1] - lum[i - sw - 1] - 2 * lum[i - 1] - lum[i + sw - 1];
      const gy = lum[i + sw - 1] + 2 * lum[i + sw] + lum[i + sw + 1] - lum[i - sw - 1] - 2 * lum[i - sw] - lum[i - sw + 1];
      weight[i] = Math.hypot(gx, gy);
      max = Math.max(max, weight[i]);
    }
  }
  const floor = max * 0.04;
  let total = 0;
  for (let i = 0; i < weight.length; i++) {
    total += weight[i] + floor;
    weight[i] = total;
  }

  const minBrightness = options.minBrightness ?? 110;
  const contours: Float32Array[] = [];
  const colors: Uint8Array[] = [];
  for (let k = 0; k < options.count; k++) {
    const target = Math.random() * total;
    let lo = 0;
    let hi = weight.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (weight[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const x = lo % sw;
    const y = Math.floor(lo / sw);
    contours.push(new Float32Array([(x + Math.random()) / ratio, (y + Math.random()) / ratio]));
    let r = px[lo * 4];
    let g = px[lo * 4 + 1];
    let b = px[lo * 4 + 2];
    const peak = Math.max(r, g, b, 1);
    if (peak < minBrightness) {
      const boost = minBrightness / peak;
      r = Math.min(255, r * boost + 1);
      g = Math.min(255, g * boost + 1);
      b = Math.min(255, b * boost + 1);
    }
    colors.push(new Uint8Array([r, g, b]));
  }
  // Pin the bounds to the full box so placement does not depend on where dots landed.
  contours.push(new Float32Array([0, 0]), new Float32Array([options.width - 1, options.height - 1]));
  colors.push(new Uint8Array([1, 1, 1]), new Uint8Array([1, 1, 1]));
  return artFromContours(contours, colors);
}
