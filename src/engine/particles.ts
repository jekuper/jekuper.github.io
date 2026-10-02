import type { Rgb } from './math';

export const ALIVE = 1;
export const GRAVITATABLE = 2;
export const HAS_FIX = 4;
export const FIX_ACTIVE = 8;
export const SPIRALING = 16;
export const LINKED = 32;
export const COLOR_FADING = 64;
/** Drawn additively with `alpha`, so dense clusters glow. */
export const GLOW = 128;

export const ARRIVE_NONE = 0;
export const ARRIVE_FIX = 1;
export const ARRIVE_DESTROY = 2;

const F64 = ['x', 'y', 'vx', 'vy', 'fx', 'fy', 'fixX', 'fixY', 'spStartX', 'spStartY', 'spTargetX', 'spTargetY'] as const;
const F32 = ['damping', 'size', 'alpha', 'r', 'g', 'b', 'tr', 'tg', 'tb', 'fadeSpeed', 'fixK', 'spTime', 'spDuration', 'spRadius', 'linkAlpha', 'linkAccel'] as const;
const I32 = ['link'] as const;
const U32 = ['gen', 'linkGen'] as const;
const U8 = ['flags', 'onArrive'] as const;

type TypedArray = Float64Array | Float32Array | Int32Array | Uint32Array | Uint8Array;
type ArrayCtor = { new (length: number): TypedArray };

const LAYOUT: [readonly string[], ArrayCtor][] = [
  [F64, Float64Array],
  [F32, Float32Array],
  [I32, Int32Array],
  [U32, Uint32Array],
  [U8, Uint8Array],
];

/**
 * Structure-of-arrays particle storage. Slots are stable for a particle's
 * lifetime; `gen` changes on every free so stale handles can be detected.
 */
export class ParticleStore {
  capacity = 0;
  /** One past the highest slot in use. Iterate `0..end` and test ALIVE. */
  end = 0;
  live = 0;

  declare x: Float64Array;
  declare y: Float64Array;
  declare vx: Float64Array;
  declare vy: Float64Array;
  declare fx: Float64Array;
  declare fy: Float64Array;
  declare fixX: Float64Array;
  declare fixY: Float64Array;
  declare spStartX: Float64Array;
  declare spStartY: Float64Array;
  declare spTargetX: Float64Array;
  declare spTargetY: Float64Array;

  declare damping: Float32Array;
  declare size: Float32Array;
  declare alpha: Float32Array;
  declare r: Float32Array;
  declare g: Float32Array;
  declare b: Float32Array;
  declare tr: Float32Array;
  declare tg: Float32Array;
  declare tb: Float32Array;
  declare fadeSpeed: Float32Array;
  declare fixK: Float32Array;
  declare spTime: Float32Array;
  declare spDuration: Float32Array;
  declare spRadius: Float32Array;
  declare linkAlpha: Float32Array;
  declare linkAccel: Float32Array;

  declare link: Int32Array;
  declare gen: Uint32Array;
  declare linkGen: Uint32Array;
  declare flags: Uint8Array;
  declare onArrive: Uint8Array;

  private free = new Int32Array(0);
  private freeCount = 0;

  constructor(initialCapacity = 4096) {
    this.resize(initialCapacity);
  }

  spawn(x: number, y: number): number {
    let i: number;
    if (this.freeCount > 0) {
      i = this.free[--this.freeCount];
    } else {
      if (this.end === this.capacity) this.resize(this.capacity * 2);
      i = this.end++;
    }
    this.live++;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = this.vy[i] = this.fx[i] = this.fy[i] = 0;
    this.damping[i] = 1;
    this.size[i] = 0;
    this.alpha[i] = 1;
    this.r[i] = this.g[i] = this.b[i] = 0;
    this.spTime[i] = this.spRadius[i] = 0;
    this.spDuration[i] = 1;
    this.link[i] = -1;
    this.linkAlpha[i] = this.linkAccel[i] = 0;
    this.onArrive[i] = ARRIVE_NONE;
    this.flags[i] = ALIVE | GRAVITATABLE;
    return i;
  }

  destroy(i: number): void {
    if (!(this.flags[i] & ALIVE)) return;
    this.flags[i] = 0;
    this.gen[i]++;
    this.free[this.freeCount++] = i;
    this.live--;
  }

  isAlive(i: number, gen: number): boolean {
    return (this.flags[i] & ALIVE) !== 0 && this.gen[i] === gen;
  }

  clear(): void {
    for (let i = 0; i < this.end; i++) {
      if (this.flags[i] & ALIVE) this.gen[i]++;
      this.flags[i] = 0;
    }
    this.end = 0;
    this.live = 0;
    this.freeCount = 0;
  }

  setColor(i: number, c: Rgb): void {
    this.r[i] = c.r;
    this.g[i] = c.g;
    this.b[i] = c.b;
    this.flags[i] &= ~COLOR_FADING;
  }

  /** Fades towards `c` at a constant rate so it arrives after `time` seconds. */
  fadeColor(i: number, c: Rgb, time: number): void {
    this.tr[i] = c.r;
    this.tg[i] = c.g;
    this.tb[i] = c.b;
    const dist = Math.hypot(c.r - this.r[i], c.g - this.g[i], c.b - this.b[i]);
    this.fadeSpeed[i] = dist / time;
    this.flags[i] |= COLOR_FADING;
  }

  setFix(i: number, x: number, y: number, k: number, active: boolean): void {
    this.fixX[i] = x;
    this.fixY[i] = y;
    this.fixK[i] = k;
    this.flags[i] = (this.flags[i] | HAS_FIX) & ~FIX_ACTIVE;
    if (active) this.flags[i] |= FIX_ACTIVE;
  }

  clearFix(i: number): void {
    this.flags[i] &= ~(HAS_FIX | FIX_ACTIVE);
  }

  setLink(i: number, next: number, fadeAccel: number): void {
    this.link[i] = next;
    this.linkGen[i] = this.gen[next];
    this.linkAlpha[i] = 0;
    this.linkAccel[i] = fadeAccel;
    this.flags[i] |= LINKED;
  }

  setLinkAccel(i: number, accel: number): void {
    this.linkAccel[i] = accel;
  }

  clearLink(i: number): void {
    this.flags[i] &= ~LINKED;
  }

  spiralTo(i: number, radius: number, x: number, y: number, duration: number, onArrive: number): void {
    this.spRadius[i] = radius;
    this.spTargetX[i] = x;
    this.spTargetY[i] = y;
    this.spDuration[i] = duration;
    this.spTime[i] = 0;
    this.onArrive[i] = onArrive;
    this.flags[i] |= SPIRALING;
  }

  private resize(capacity: number): void {
    const self = this as unknown as Record<string, TypedArray>;
    for (const [keys, Ctor] of LAYOUT) {
      for (const key of keys) {
        const next = new Ctor(capacity);
        if (self[key]) next.set(self[key].subarray(0, this.end));
        self[key] = next;
      }
    }
    const free = new Int32Array(capacity);
    free.set(this.free.subarray(0, this.freeCount));
    this.free = free;
    this.capacity = capacity;
  }
}
