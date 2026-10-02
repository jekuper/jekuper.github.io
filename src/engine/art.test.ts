import { describe, expect, it } from 'vitest';
import { decodeLineArt } from './art';

interface Point {
  x: number;
  y: number;
  r?: number;
  g?: number;
  b?: number;
}

// Mirrors tools/lineart packing so the two stay in sync.
function encode(contours: Point[][]): ArrayBuffer {
  const out: number[] = [];
  for (const contour of contours) {
    out.push(contour.length >> 8, contour.length & 0xff);
    for (const p of contour) {
      let v = (BigInt(p.x) << 38n) | (BigInt(p.y) << 24n) | (BigInt(p.r ?? 0) << 16n) | (BigInt(p.g ?? 0) << 8n) | BigInt(p.b ?? 0);
      const bytes: number[] = [];
      for (let i = 0; i < 7; i++) {
        bytes.unshift(Number(v & 0xffn));
        v >>= 8n;
      }
      out.push(...bytes);
    }
  }
  return new Uint8Array(out).buffer;
}

describe('decodeLineArt', () => {
  it('round trips points, colors and contours', () => {
    const contours: Point[][] = [
      [
        { x: 0, y: 0 },
        { x: 16383, y: 16383, r: 255, g: 1, b: 128 },
      ],
      [{ x: 1021, y: 782, r: 10, g: 20, b: 30 }],
    ];
    const art = decodeLineArt(encode(contours));
    expect(art.contourCount).toBe(2);
    expect(art.pointCount).toBe(3);
    expect(Array.from(art.starts)).toEqual([0, 2, 3]);
    expect(Array.from(art.x)).toEqual([0, 16383, 1021]);
    expect(Array.from(art.y)).toEqual([0, 16383, 782]);
    expect(Array.from(art.rgb)).toEqual([0, 0, 0, 255, 1, 128, 10, 20, 30]);
    expect(art.width).toBe(16384);
    expect(art.height).toBe(16384);
  });

  it('rejects truncated data', () => {
    const data = new Uint8Array(encode([[{ x: 1, y: 1 }]])).slice(0, 5);
    expect(() => decodeLineArt(data.buffer)).toThrow();
  });
});
