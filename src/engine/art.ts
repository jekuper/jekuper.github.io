/**
 * Line art: closed contours of points with optional per-point color.
 * Binary layout (big-endian): per contour a uint16 point count, then 7 bytes
 * per point holding x:14 | y:14 | r:8 | g:8 | b:8 in the low 52 bits.
 */
export interface LineArt {
  /** Contour i covers points `starts[i]` up to `starts[i + 1]`. */
  starts: Uint32Array;
  x: Float32Array;
  y: Float32Array;
  /** Three bytes per point. Black means "use the group color". */
  rgb: Uint8Array;
  pointCount: number;
  contourCount: number;
  /** Bounding box size, max - min + 1 as produced by tools/lineart. */
  width: number;
  height: number;
}

const POINT_BYTES = 7;

export function decodeLineArt(buffer: ArrayBuffer): LineArt {
  const bytes = new Uint8Array(buffer);
  let contourCount = 0;
  let pointCount = 0;
  for (let o = 0; o + 2 <= bytes.length; ) {
    const n = (bytes[o] << 8) | bytes[o + 1];
    o += 2 + n * POINT_BYTES;
    if (o > bytes.length) throw new Error('Line art data is truncated');
    contourCount++;
    pointCount += n;
  }

  const starts = new Uint32Array(contourCount + 1);
  const x = new Float32Array(pointCount);
  const y = new Float32Array(pointCount);
  const rgb = new Uint8Array(pointCount * 3);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let p = 0;
  let o = 0;
  for (let c = 0; c < contourCount; c++) {
    const n = (bytes[o] << 8) | bytes[o + 1];
    o += 2;
    starts[c] = p;
    for (let k = 0; k < n; k++, p++, o += POINT_BYTES) {
      const px = ((bytes[o] & 0x0f) << 10) | (bytes[o + 1] << 2) | (bytes[o + 2] >> 6);
      const py = ((bytes[o + 2] & 0x3f) << 8) | bytes[o + 3];
      x[p] = px;
      y[p] = py;
      rgb[p * 3] = bytes[o + 4];
      rgb[p * 3 + 1] = bytes[o + 5];
      rgb[p * 3 + 2] = bytes[o + 6];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }
  starts[contourCount] = p;

  const empty = pointCount === 0;
  return {
    starts,
    x,
    y,
    rgb,
    pointCount,
    contourCount,
    width: empty ? 0 : maxX - minX + 1,
    height: empty ? 0 : maxY - minY + 1,
  };
}

const cache = new Map<string, Promise<LineArt>>();

export function loadLineArt(url: string): Promise<LineArt> {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
        return res.arrayBuffer();
      })
      .then(decodeLineArt);
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
}

/**
 * Scales to the smaller of the two limits on its own axis and keeps the aspect
 * ratio. The other axis is not clamped, so very wide art can overflow maxWidth.
 */
export function fitArt(art: LineArt, maxWidth: number, maxHeight: number): { width: number; height: number } {
  if (maxHeight <= maxWidth) return { width: maxHeight * (art.width / art.height), height: maxHeight };
  return { width: maxWidth, height: maxWidth * (art.height / art.width) };
}
