import { GRAVITY } from './config';

export interface GravitySource {
  x: number;
  y: number;
  magnitude: number;
}

/**
 * Acceleration from all sources: `m * d / max(1, |d|^2)`, so it falls off as 1/r.
 * Direct summation for a handful of sources, Barnes-Hut past a threshold.
 */
export class GravityField {
  ax = 0;
  ay = 0;
  private sources: readonly GravitySource[] = [];
  private tree = new BarnesHutTree();
  private useTree = false;

  build(sources: readonly GravitySource[]): void {
    this.sources = sources;
    this.useTree = sources.length > GRAVITY.barnesHutThreshold;
    if (this.useTree) this.tree.build(sources);
  }

  get empty(): boolean {
    return this.sources.length === 0;
  }

  /** Writes the acceleration at (x, y) into `ax`, `ay`. */
  sample(x: number, y: number): void {
    if (this.useTree) {
      this.tree.sample(x, y);
      this.ax = this.tree.ax;
      this.ay = this.tree.ay;
      return;
    }
    let ax = 0;
    let ay = 0;
    for (const s of this.sources) {
      const dx = s.x - x;
      const dy = s.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 === 0) continue;
      const f = s.magnitude / Math.max(1, d2);
      ax += f * dx;
      ay += f * dy;
    }
    this.ax = ax;
    this.ay = ay;
  }
}

const MAX_DEPTH = 24;

/** Quadtree over flat typed arrays, rebuilt in place each step without allocation. */
export class BarnesHutTree {
  ax = 0;
  ay = 0;

  private capacity = 0;
  private count = 0;
  private originX = new Float64Array(0);
  private originY = new Float64Array(0);
  private size = new Float64Array(0);
  private comX = new Float64Array(0);
  private comY = new Float64Array(0);
  private mass = new Float64Array(0);
  private absMass = new Float64Array(0);
  private firstChild = new Int32Array(0);
  private head = new Int32Array(0);
  private next = new Int32Array(0);
  private stack = new Int32Array(4 * (MAX_DEPTH + 2));
  private sources: readonly GravitySource[] = [];

  build(sources: readonly GravitySource[]): void {
    this.sources = sources;
    if (this.next.length < sources.length) this.next = new Int32Array(sources.length * 2);
    this.count = 0;
    if (sources.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of sources) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x);
      maxY = Math.max(maxY, s.y);
    }
    this.addNode(minX, minY, Math.max(maxX - minX, maxY - minY) + 1);
    for (let i = 0; i < sources.length; i++) this.insert(i);

    // Children always have higher indices than parents, so a reverse sweep is bottom-up.
    for (let n = this.count - 1; n >= 0; n--) {
      let m = 0;
      let am = 0;
      let wx = 0;
      let wy = 0;
      const c = this.firstChild[n];
      if (c === -1) {
        for (let b = this.head[n]; b !== -1; b = this.next[b]) {
          const s = sources[b];
          const a = Math.abs(s.magnitude);
          m += s.magnitude;
          am += a;
          wx += s.x * a;
          wy += s.y * a;
        }
      } else {
        for (let k = c; k < c + 4; k++) {
          m += this.mass[k];
          am += this.absMass[k];
          wx += this.comX[k] * this.absMass[k];
          wy += this.comY[k] * this.absMass[k];
        }
      }
      this.mass[n] = m;
      this.absMass[n] = am;
      const half = this.size[n] / 2;
      this.comX[n] = am > 0 ? wx / am : this.originX[n] + half;
      this.comY[n] = am > 0 ? wy / am : this.originY[n] + half;
    }
  }

  sample(x: number, y: number): void {
    let ax = 0;
    let ay = 0;
    const theta2 = GRAVITY.theta * GRAVITY.theta;
    const stack = this.stack;
    let top = 0;
    if (this.count > 0) stack[top++] = 0;

    while (top > 0) {
      const n = stack[--top];
      if (this.absMass[n] === 0) continue;
      const c = this.firstChild[n];
      if (c === -1) {
        for (let b = this.head[n]; b !== -1; b = this.next[b]) {
          const s = this.sources[b];
          const dx = s.x - x;
          const dy = s.y - y;
          const d2 = dx * dx + dy * dy;
          if (d2 === 0) continue;
          const f = s.magnitude / Math.max(1, d2);
          ax += f * dx;
          ay += f * dy;
        }
        continue;
      }
      const dx = this.comX[n] - x;
      const dy = this.comY[n] - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && (this.size[n] * this.size[n]) / d2 < theta2) {
        const f = this.mass[n] / Math.max(1, d2);
        ax += f * dx;
        ay += f * dy;
      } else {
        stack[top++] = c;
        stack[top++] = c + 1;
        stack[top++] = c + 2;
        stack[top++] = c + 3;
      }
    }
    this.ax = ax;
    this.ay = ay;
  }

  private insert(i: number): void {
    const s = this.sources[i];
    let n = 0;
    for (let depth = 0; ; depth++) {
      if (this.firstChild[n] === -1) {
        if (this.head[n] === -1 || depth >= MAX_DEPTH) {
          this.next[i] = this.head[n];
          this.head[n] = i;
          return;
        }
        this.split(n);
      }
      n = this.firstChild[n] + this.quadrant(n, s.x, s.y);
    }
  }

  private split(n: number): void {
    const half = this.size[n] / 2;
    const ox = this.originX[n];
    const oy = this.originY[n];
    const c = this.addNode(ox, oy, half);
    this.addNode(ox + half, oy, half);
    this.addNode(ox, oy + half, half);
    this.addNode(ox + half, oy + half, half);
    this.firstChild[n] = c;

    // A leaf above max depth holds exactly one body; push it down.
    const moved = this.head[n];
    this.head[n] = -1;
    const s = this.sources[moved];
    const k = c + this.quadrant(n, s.x, s.y);
    this.next[moved] = -1;
    this.head[k] = moved;
  }

  private quadrant(n: number, x: number, y: number): number {
    const half = this.size[n] / 2;
    const qx = x >= this.originX[n] + half ? 1 : 0;
    const qy = y >= this.originY[n] + half ? 1 : 0;
    return qy * 2 + qx;
  }

  private addNode(x: number, y: number, size: number): number {
    if (this.count === this.capacity) this.grow();
    const n = this.count++;
    this.originX[n] = x;
    this.originY[n] = y;
    this.size[n] = size;
    this.firstChild[n] = -1;
    this.head[n] = -1;
    return n;
  }

  private grow(): void {
    const cap = Math.max(64, this.capacity * 2);
    const f64 = (a: Float64Array) => {
      const b = new Float64Array(cap);
      b.set(a);
      return b;
    };
    const i32 = (a: Int32Array) => {
      const b = new Int32Array(cap);
      b.set(a);
      return b;
    };
    this.originX = f64(this.originX);
    this.originY = f64(this.originY);
    this.size = f64(this.size);
    this.comX = f64(this.comX);
    this.comY = f64(this.comY);
    this.mass = f64(this.mass);
    this.absMass = f64(this.absMass);
    this.firstChild = i32(this.firstChild);
    this.head = i32(this.head);
    this.capacity = cap;
  }
}
