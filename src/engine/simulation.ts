import type { LineArt } from './art';
import { createBomb, createWell, type Bomb, type Emitter, type Spark, type Well } from './bodies';
import {
  BACKGROUND,
  BOMB,
  CALM,
  CURSOR,
  EMITTER,
  ERASER,
  FLIGHT,
  FOCUS_FADE,
  GALAXY,
  QUICK_FLIGHT,
  LINK,
  MORPH,
  PARTICLE,
  SCATTER_SPEED,
  SHAKE,
  SPARKS,
  SPIRAL,
  TRAIL,
  WELL,
} from './config';
import { GravityField } from './gravity';
import { distanceToSegment, easeInOutCubic, easeOutCubic, easeInOutCubicStepped, randomRange, randomSign, wrap, type Rgb } from './math';
import {
  ALIVE,
  AMBIENT_LAYER,
  ARRIVE_DESTROY,
  ARRIVE_FIX,
  COLOR_FADING,
  FIX_ACTIVE,
  GLOW,
  GRAVITATABLE,
  HAS_FIX,
  LINKED,
  MAIN_LAYER,
  ParticleStore,
  QUICK,
  ROUND,
  SPIRALING,
} from './particles';
import type { DrawBatch } from './renderer';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where and how a group draws a line art. Units are world device pixels. */
export interface MorphTarget {
  art: LineArt;
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
  color: Rgb;
  /** Strength pulling each dot to its spot. Negative also disables gravity. */
  density: number;
  /** Seconds to hold the image once formed; Infinity keeps it. */
  holdTime: number;
  /** Emitter the group's new dots come from and retired dots return to. */
  emitter?: string;
  /** Named clip region (see `defineClip`) the group's dots are drawn inside. */
  clip?: string;
  /** Dots the art does not need: sent into the emitter, or left drifting. */
  surplus?: 'retire' | 'release';
  /** No fade-out wait, lines cut at once, short flights that start immediately. For swaps, not first draws. */
  quick?: boolean;
  /** After the hold: return the dots to the emitter, let them drift, or throw them outward. */
  afterHold?: 'dissolve' | 'release' | 'scatter';
}

export interface GalaxyOptions {
  /** Below 1 the dots are drawn additively, so dense arms glow. */
  alpha?: number;
  fadeIn?: number;
  color: Rgb;
}

export interface FieldOptions {
  /** Below 1 the field is drawn additively, so dense clusters glow. */
  alpha?: number;
  /** Seconds to fade in from the background color. */
  fadeIn?: number;
  /** Corner wells still pull but are not drawn. */
  hiddenWells?: boolean;
  /** Named clip region the field is drawn inside. */
  clip?: string;
}

type Phase = 'fading' | 'forming' | 'holding' | 'dissolving';

interface Group {
  slots: number[];
  gens: number[];
  phase: Phase;
  timer: number;
  target: MorphTarget | null;
  emitter: string;
  clip: number;
}

export interface Point {
  x: number;
  y: number;
}

export const DEFAULT_EMITTER = 'default';

/** All simulation state, in world device pixels. Knows nothing about the DOM. */
export class World {
  readonly particles = new ParticleStore();
  readonly wells: Well[] = [];
  readonly bombs: Bomb[] = [];
  readonly sparks: Spark[] = [];
  readonly emitters = new Map<string, Emitter>();
  /** Viewport size. */
  width = 1;
  height = 1;
  /** Top-left of the viewport in the world. */
  camX = 0;
  camY = 0;
  cursorX = -1000;
  cursorY = -1000;
  /** The cursor gently pulls nearby dots while it is over the canvas. */
  cursorActive = false;
  eraserVisible = false;
  /** Reduced motion, see CALM. */
  calm = false;
  shakeX = 0;
  shakeY = 0;

  private groups = new Map<string, Group>();
  /** Clip rectangles; index 0 means unclipped. */
  private clips: Rect[] = [{ x: 0, y: 0, width: 0, height: 0 }];
  private clipIds = new Map<string, number>();
  private gravity = new GravityField();
  private ambientGravity = new GravityField();
  private shakeTime = 0;
  /** Dots outside the focused clip fade out by `level` (0 to 1); clip 0 means no focus. */
  private focus = { clip: 0, level: 0, target: 0 };

  setBounds(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /** Removes everything except emitters, which are placed by the page. */
  clear(): void {
    this.particles.clear();
    this.clearBodies();
    this.groups.clear();
    this.shakeTime = 0;
    this.eraserVisible = false;
  }

  /** Creates or moves a named region; dots of groups clipped to it are drawn only inside it. */
  defineClip(name: string, rect: Rect): void {
    const id = this.clipIds.get(name);
    if (id !== undefined) {
      this.clips[id] = rect;
    } else if (this.clips.length < 256) {
      this.clipIds.set(name, this.clips.length);
      this.clips.push(rect);
    }
  }

  /** Fades out everything not drawn in the named clip, e.g. behind a menu; null fades it back. */
  setFocus(name: string | null): void {
    if (name === null) {
      this.focus.target = 0;
      return;
    }
    this.focus.clip = this.clipId(name);
    this.focus.target = 1;
  }

  private clipId(name: string | undefined): number {
    return name === undefined ? 0 : (this.clipIds.get(name) ?? 0);
  }

  setEmitter(name: string, x: number, y: number, visible = true): void {
    this.emitters.set(name, { x, y, visible });
  }

  removeEmitter(name: string): void {
    this.emitters.delete(name);
  }

  /** Destroys a group's dots and its field wells at once. */
  removeGroup(name: string): void {
    removeWhere(this.wells, (well) => well.group === name);
    const group = this.groups.get(name);
    if (!group) return;
    this.forEachMember(group, (i) => this.particles.destroy(i));
    this.groups.delete(name);
  }

  /** Removes wells, bombs and sparks. */
  clearBodies(): void {
    this.wells.length = 0;
    this.bombs.length = 0;
    this.sparks.length = 0;
  }

  /** Translates the whole group, dots in flight included, without disturbing their motion. */
  moveGroup(name: string, dx: number, dy: number): void {
    const group = this.groups.get(name);
    if (!group) return;
    const p = this.particles;
    if (group.target) {
      group.target.originX += dx;
      group.target.originY += dy;
    }
    this.forEachMember(group, (i) => {
      p.x[i] += dx;
      p.y[i] += dy;
      p.fixX[i] += dx;
      p.fixY[i] += dy;
      p.spStartX[i] += dx;
      p.spStartY[i] += dy;
      p.spCtrlX[i] += dx;
      p.spCtrlY[i] += dy;
      p.spTargetX[i] += dx;
      p.spTargetY[i] += dy;
    });
  }

  /**
   * Shifts the group's free dots by a per-dot fraction (0.4 to 1) of (dx, dy).
   * The fraction is fixed per slot, so shifting back undoes it.
   */
  drift(name: string, dx: number, dy: number): void {
    const group = this.groups.get(name);
    if (!group || this.calm) return;
    const p = this.particles;
    this.forEachMember(group, (i) => {
      if (p.flags[i] & (FIX_ACTIVE | SPIRALING)) return;
      const k = 0.4 + 0.6 * (((i * 2654435761) >>> 0) / 4294967296);
      p.x[i] += dx * k;
      p.y[i] += dy * k;
    });
  }

  hasGroup(name: string): boolean {
    return this.groups.has(name);
  }

  addWell(x: number, y: number, magnitude: number, onTop: boolean, wrapTop = this.camY): Well {
    const well = createWell(x, y, magnitude, onTop, wrapTop);
    this.wells.push(well);
    return well;
  }

  /** A grid of drifting dots with a well in each corner of `rect`. */
  seedField(name: string, rect: Rect, count: number, wellMagnitude: number, options: FieldOptions = {}): void {
    if (this.calm) wellMagnitude *= CALM.fieldPull;
    const alpha = options.alpha ?? 1;
    const clip = this.clipId(options.clip);
    const wrapTop = Math.floor(rect.y / this.height) * this.height;
    for (const fy of [0, 1]) {
      for (const fx of [0, 1]) {
        const well = this.addWell(rect.x + fx * rect.width, rect.y + fy * rect.height, wellMagnitude, false, wrapTop);
        well.hidden = options.hiddenWells ?? false;
        well.group = name;
      }
    }
    const columns = Math.max(1, Math.floor(Math.sqrt((count * rect.width) / rect.height)));
    const rows = Math.ceil(count / columns);
    const cellW = rect.width / columns;
    const cellH = rect.height / rows;
    const p = this.particles;
    const slots: number[] = [];
    for (let k = 0; k < count; k++) {
      const i = p.spawn(rect.x + (k % columns) * cellW, rect.y + Math.floor(k / columns) * cellH);
      p.damping[i] = PARTICLE.fieldDamping;
      p.size[i] = PARTICLE.size;
      p.spDuration[i] = PARTICLE.spiralDuration;
      p.alpha[i] = alpha;
      p.clip[i] = clip;
      p.flags[i] |= GLOW;
      if (options.fadeIn) {
        p.setColor(i, BACKGROUND);
        p.fadeColor(i, PARTICLE.fieldColor, options.fadeIn);
      } else {
        p.setColor(i, PARTICLE.fieldColor);
      }
      slots.push(i);
    }
    const existing = this.groups.get(name);
    if (existing) {
      // Joins a group that is already showing something; the next morph reuses these dots.
      for (const i of slots) {
        existing.slots.push(i);
        existing.gens.push(p.gen[i]);
      }
      return;
    }
    this.groups.set(name, {
      slots,
      gens: slots.map((i) => p.gen[i]),
      phase: 'holding',
      timer: Infinity,
      target: null,
      emitter: DEFAULT_EMITTER,
      clip,
    });
  }

  /**
   * A spiral galaxy on the ambient layer: the cursor, user wells and bombs do
   * not touch it. With this engine's 1/r pull a circular orbit has the same
   * speed at every radius, so inner dots lap outer ones and the arms wind slowly.
   */
  seedGalaxy(name: string, cx: number, cy: number, radius: number, count: number, magnitude: number, options: GalaxyOptions): void {
    this.removeGroup(name);
    if (this.calm) magnitude *= CALM.galaxyPull;
    const well = this.addWell(cx, cy, magnitude, false, Math.floor(cy / this.height) * this.height);
    well.hidden = true;
    well.group = name;
    well.layer = AMBIENT_LAYER;

    const p = this.particles;
    const speed = Math.sqrt(Math.abs(magnitude));
    const slots: number[] = [];
    for (let k = 0; k < count; k++) {
      const r = radius * (GALAXY.innerRadius + (1 - GALAXY.innerRadius) * Math.sqrt(Math.random()));
      const arm = ((k % GALAXY.arms) / GALAXY.arms) * Math.PI * 2;
      const angle = arm + (r / radius) * GALAXY.twist + randomRange(-1, 1) * GALAXY.spread;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const i = p.spawn(cx + cos * r, cy + sin * r);
      p.vx[i] = -sin * speed;
      p.vy[i] = cos * speed;
      p.layer[i] = AMBIENT_LAYER;
      p.damping[i] = 1;
      p.size[i] = GALAXY.size;
      p.alpha[i] = options.alpha ?? 1;
      p.flags[i] |= GLOW;
      if (options.fadeIn) {
        p.setColor(i, BACKGROUND);
        p.fadeColor(i, options.color, options.fadeIn);
      } else {
        p.setColor(i, options.color);
      }
      slots.push(i);
    }
    this.groups.set(name, {
      slots,
      gens: slots.map((i) => p.gen[i]),
      phase: 'holding',
      timer: Infinity,
      target: null,
      emitter: DEFAULT_EMITTER,
      clip: 0,
    });
  }

  /** Re-forms the group's dots into `target`, spawning or retiring dots as needed. */
  morph(name: string, target: MorphTarget): void {
    if (this.calm) target = { ...target, quick: true };
    let group = this.groups.get(name);
    if (!group) {
      group = { slots: [], gens: [], phase: 'fading', timer: 0, target, emitter: DEFAULT_EMITTER, clip: 0 };
      this.groups.set(name, group);
    }
    group.target = target;
    group.emitter = target.emitter ?? DEFAULT_EMITTER;
    group.clip = this.clipId(target.clip);
    group.phase = 'fading';
    group.timer = 0;
    const p = this.particles;
    if (!target.quick) {
      this.forEachMember(group, (i) => {
        if (p.flags[i] & LINKED && p.linkAccel[i] > 0) {
          p.setLinkAccel(i, LINK.fadeOut);
          group.timer = MORPH.fadeOutTime;
        }
      });
    }
    if (group.timer === 0) this.assign(group);
  }

  /** Lets the group's dots go: lines fade out and dots drift freely. */
  release(name: string): void {
    const group = this.groups.get(name);
    if (!group) return;
    const p = this.particles;
    this.forEachMember(group, (i) => {
      if (p.flags[i] & LINKED) p.setLinkAccel(i, LINK.fadeOut);
      p.clearFix(i);
    });
  }

  /** Cuts the group's lines at once and throws its dots away from its center. */
  scatter(name: string, speed = SCATTER_SPEED): void {
    if (this.calm) {
      this.recall(name);
      return;
    }
    const group = this.groups.get(name);
    if (!group) return;
    const p = this.particles;
    let cx = 0;
    let cy = 0;
    let n = 0;
    this.forEachMember(group, (i) => {
      p.clearLink(i);
      p.clearFix(i);
      cx += p.x[i];
      cy += p.y[i];
      n++;
    });
    if (n === 0) return;
    cx /= n;
    cy /= n;
    this.forEachMember(group, (i) => {
      p.flags[i] &= ~SPIRALING;
      const dx = p.x[i] - cx;
      const dy = p.y[i] - cy;
      const len = Math.hypot(dx, dy) || 1;
      const v = speed * randomRange(0.3, 1);
      p.vx[i] = (dx / len) * v + randomRange(-0.2, 0.2) * speed;
      p.vy[i] = (dy / len) * v + randomRange(-0.2, 0.2) * speed;
    });
  }

  /** Releases the group, then sends its dots back into the emitter. */
  dissolve(name: string): void {
    const group = this.groups.get(name);
    if (!group || group.phase === 'dissolving') return;
    this.release(name);
    group.phase = 'dissolving';
    group.timer = MORPH.dissolveTime;
  }

  /** Cuts the group's lines and sends its dots straight home on short flights, without the dissolve wait. */
  recall(name: string): void {
    const group = this.groups.get(name);
    if (!group) return;
    this.forEachMember(group, (i) => this.retire(i, group.emitter, Math.random() * QUICK_FLIGHT.stagger, true));
    this.groups.delete(name);
  }

  spawnWellAtCursor(repel: boolean): void {
    this.addWell(this.cursorX, this.cursorY, repel ? -WELL.clickMagnitude : WELL.clickMagnitude, true);
  }

  aimBomb(): Bomb {
    const bomb = createBomb(this.cursorX, this.cursorY);
    this.bombs.push(bomb);
    return bomb;
  }

  launchBomb(bomb: Bomb, impulseX: number, impulseY: number): void {
    bomb.flying = true;
    bomb.wrapTop = this.camY;
    bomb.vx += impulseX;
    bomb.vy += impulseY;
  }

  eraseAtCursor(): void {
    const r2 = ERASER.radius * ERASER.radius;
    const cx = this.cursorX;
    const cy = this.cursorY;
    const p = this.particles;
    for (let i = 0; i < p.end; i++) {
      if (p.flags[i] & ALIVE && p.layer[i] === MAIN_LAYER && (p.x[i] - cx) ** 2 + (p.y[i] - cy) ** 2 <= r2) p.destroy(i);
    }
    const near = (b: { x: number; y: number }) => (b.x - cx) ** 2 + (b.y - cy) ** 2 <= r2;
    removeWhere(this.wells, (well) => well.layer === MAIN_LAYER && near(well));
    removeWhere(this.bombs, near);
  }

  fixedStep(dt: number): void {
    this.stepGroups(dt);
    this.stepFlights(dt);
    this.stepPhysics(dt);
    this.detonate();
  }

  /** Per-frame work: follow the cursor, fade colors and lines, fill the draw batch. */
  frame(dt: number, batch: DrawBatch): void {
    for (const bomb of this.bombs) {
      if (!bomb.flying) {
        bomb.x = this.cursorX;
        bomb.y = this.cursorY;
      } else {
        bomb.trail.push(bomb.x, bomb.y);
        if (bomb.trail.length > TRAIL.length * 2) bomb.trail.splice(0, 2);
      }
    }
    this.updateShake(dt);
    const focus = this.focus;
    const fadeStep = dt / FOCUS_FADE;
    focus.level += Math.max(-fadeStep, Math.min(fadeStep, focus.target - focus.level));
    for (const s of this.sparks) s.age += dt;
    removeWhere(this.sparks, (s) => s.age >= SPARKS.life);

    batch.reset();
    if (this.eraserVisible) {
      const c = ERASER.color;
      batch.point(this.cursorX, this.cursorY, c.r, c.g, c.b, ERASER.radius);
    }
    // Bodies have no clip, so they belong to the faded-out world while focused.
    const bodies = focus.level < 0.5;
    if (bodies) {
      this.drawEmitters(batch);
      this.drawWells(batch, false);
    }
    this.drawParticles(dt, batch);
    if (bodies) {
      this.drawWells(batch, true);
      this.drawBombs(batch);
      this.drawSparks(batch);
    }
  }

  private emitterPoint(name: string): Point {
    return this.emitters.get(name) ?? { x: this.camX + this.width / 2, y: this.camY + this.height / 2 };
  }

  private stepGroups(dt: number): void {
    const p = this.particles;
    for (const [name, group] of this.groups) {
      switch (group.phase) {
        case 'fading':
          group.timer -= dt;
          if (group.timer <= 0) this.assign(group);
          break;
        case 'forming': {
          let done = true;
          this.forEachMember(group, (i) => {
            if (p.flags[i] & SPIRALING) done = false;
          });
          if (done) {
            group.phase = 'holding';
            group.timer = (group.target?.holdTime ?? Infinity) - MORPH.dissolveTime;
          }
          break;
        }
        case 'holding': {
          group.timer -= dt;
          if (group.timer > 0) break;
          const after = group.target?.afterHold ?? 'dissolve';
          if (after === 'dissolve') {
            this.dissolve(name);
          } else {
            if (after === 'scatter') this.scatter(name);
            else this.release(name);
            group.timer = Infinity;
          }
          break;
        }
        case 'dissolving':
          group.timer -= dt;
          if (group.timer <= 0) {
            this.forEachMember(group, (i) => this.retire(i, group.emitter, Math.random() * FLIGHT.retireStagger));
            this.groups.delete(name);
          }
          break;
      }
    }
  }

  /** Binds members (plus new emitter dots) to the target's contour points. */
  private assign(group: Group): void {
    const target = group.target;
    if (!target) return;
    const p = this.particles;
    const art = target.art;

    const members: number[] = [];
    this.forEachMember(group, (i) => {
      p.clearLink(i);
      p.clearFix(i);
      members.push(i);
    });
    // Surplus dots either go home to the emitter or stay in the group, drifting.
    const kept: number[] = [];
    while (members.length > art.pointCount) {
      const i = members.pop()!;
      if (target.surplus === 'release') kept.push(i);
      else this.retire(i, group.emitter, Math.random() * FLIGHT.retireStagger);
    }

    const order: number[] = [];
    for (let k = members.length; k < art.pointCount; k++) order.push(this.spawnAtEmitter(target.color, group.emitter));
    for (const i of members) order.push(i);

    const total = Math.max(1, art.pointCount);
    for (let c = 0; c < art.contourCount; c++) {
      const start = art.starts[c];
      const end = art.starts[c + 1];
      const closed = !art.closed || art.closed[c] === 1;
      for (let k = start; k < end; k++) {
        const i = order[k];
        const x = art.x[k] * target.scaleX + target.originX;
        const y = art.y[k] * target.scaleY + target.originY;

        // An open contour's last point links to itself, which draws no line.
        const next = k + 1 < end ? order[k + 1] : closed ? order[start] : i;
        p.setLink(i, next, target.quick ? LINK.quickFadeIn : LINK.fadeIn);
        p.clip[i] = group.clip;
        p.setFix(i, x, y, target.density, false);
        p.flags[i] &= ~(GLOW | ROUND);
        if (art.round) p.flags[i] |= ROUND;
        p.size[i] = art.sizes ? art.sizes[k] * target.scaleX : PARTICLE.size;
        p.alpha[i] = 1;
        if (target.density < 0) p.flags[i] &= ~GRAVITATABLE;
        else p.flags[i] |= GRAVITATABLE;

        const quick = target.quick === true && FLIGHT.style === 'arc';
        const duration = quick ? this.quickDuration(i, x, y) : this.flightDuration(i, x, y);
        if (quick) p.flags[i] |= QUICK;
        else p.flags[i] &= ~QUICK;
        const r = art.rgb[k * 3];
        const g = art.rgb[k * 3 + 1];
        const b = art.rgb[k * 3 + 2];
        if (r || g || b) p.fadeColor(i, { r, g, b }, FLIGHT.style === 'arc' ? duration : SPIRAL.artColorFade);
        else p.fadeColor(i, target.color, duration);

        // Starts follow the drawing order, so the art draws itself.
        const stagger = quick ? QUICK_FLIGHT.stagger : FLIGHT.stagger;
        const delay = FLIGHT.style === 'arc' ? (k / total) * stagger : 0;
        p.flyTo(i, x, y, duration, ARRIVE_FIX, this.flightBend(), delay);
      }
    }

    for (const i of kept) order.push(i);
    group.slots = order;
    group.gens = order.map((i) => p.gen[i]);
    group.phase = 'forming';
  }

  private flightDuration(i: number, x: number, y: number): number {
    if (FLIGHT.style === 'spiral') return Math.round(SPIRAL.minDuration + Math.random() * SPIRAL.durationRange);
    const p = this.particles;
    const dist = Math.hypot(x - p.x[i], y - p.y[i]);
    const base = Math.min(FLIGHT.maxDuration, Math.max(FLIGHT.minDuration, FLIGHT.base + dist / FLIGHT.speed));
    return base * randomRange(1 - FLIGHT.jitter, 1 + FLIGHT.jitter);
  }

  private quickDuration(i: number, x: number, y: number): number {
    const p = this.particles;
    const dist = Math.hypot(x - p.x[i], y - p.y[i]);
    const q = QUICK_FLIGHT;
    return Math.min(q.maxDuration, Math.max(q.minDuration, q.base + dist / q.speed));
  }

  private flightBend(): number {
    if (FLIGHT.style === 'spiral') return randomSign() * (SPIRAL.minRadius + Math.random() * SPIRAL.radiusRange);
    return randomSign() * randomRange(FLIGHT.minBend, FLIGHT.maxBend);
  }

  private spawnAtEmitter(color: Rgb, emitter: string): number {
    const e = this.emitterPoint(emitter);
    const w = EMITTER.width;
    const h = Math.min(this.height * EMITTER.heightRatio, EMITTER.maxHeight);
    const p = this.particles;
    const i = p.spawn(
      randomRange(e.x - w / 2 + w * EMITTER.inset, e.x + w / 2 - w * EMITTER.inset),
      randomRange(e.y - h / 2 + h * EMITTER.inset, e.y + h / 2 - h * EMITTER.inset),
    );
    p.damping[i] = PARTICLE.emittedDamping;
    p.size[i] = PARTICLE.size;
    p.spDuration[i] = PARTICLE.spiralDuration;
    p.setColor(i, color);
    return i;
  }

  /** Flies a dot into the emitter, then frees it. */
  private retire(i: number, emitter: string, delay = 0, quick = false): void {
    const e = this.emitterPoint(emitter);
    const p = this.particles;
    p.clearLink(i);
    p.clearFix(i);
    const x = randomRange(e.x - EMITTER.width / 2, e.x + EMITTER.width / 2);
    if (quick) {
      p.flags[i] |= QUICK;
      p.flyTo(i, x, e.y, this.quickDuration(i, x, e.y), ARRIVE_DESTROY, this.flightBend(), delay);
    } else if (FLIGHT.style === 'spiral') {
      p.flyTo(i, x, e.y, p.spDuration[i], ARRIVE_DESTROY, p.spRadius[i]);
    } else {
      p.flyTo(i, x, e.y, this.flightDuration(i, x, e.y), ARRIVE_DESTROY, this.flightBend(), delay);
    }
  }

  private forEachMember(group: Group, fn: (slot: number) => void): void {
    const p = this.particles;
    for (let k = 0; k < group.slots.length; k++) {
      if (p.isAlive(group.slots[k], group.gens[k])) fn(group.slots[k]);
    }
  }

  private arrive(i: number): void {
    const p = this.particles;
    p.x[i] = p.spTargetX[i];
    p.y[i] = p.spTargetY[i];
    p.vx[i] = p.vy[i] = p.fx[i] = p.fy[i] = 0;
    p.flags[i] &= ~SPIRALING;
    if (p.onArrive[i] === ARRIVE_FIX && p.flags[i] & HAS_FIX) p.flags[i] |= FIX_ACTIVE;
    else if (p.onArrive[i] === ARRIVE_DESTROY) p.destroy(i);
  }

  private stepFlights(dt: number): void {
    const p = this.particles;
    const arc = FLIGHT.style === 'arc';
    for (let i = 0; i < p.end; i++) {
      if ((p.flags[i] & (ALIVE | SPIRALING)) !== (ALIVE | SPIRALING)) continue;
      if (arc && p.spDelay[i] > 0) {
        p.spDelay[i] -= dt;
        continue;
      }
      if (p.spTime[i] === 0) {
        p.spStartX[i] = p.x[i];
        p.spStartY[i] = p.y[i];
        if (arc) {
          // Control point off the midpoint, perpendicular to the path.
          const dx = p.spTargetX[i] - p.x[i];
          const dy = p.spTargetY[i] - p.y[i];
          const bend = p.spRadius[i];
          p.spCtrlX[i] = p.x[i] + dx / 2 - dy * bend;
          p.spCtrlY[i] = p.y[i] + dy / 2 + dx * bend;
        }
      }
      p.spTime[i] += dt;
      if (arc) this.stepArc(i, dt);
      else this.stepSpiral(i);
    }
  }

  /** Quadratic curve with eased timing. Position is set directly; physics skips flying dots. */
  private stepArc(i: number, dt: number): void {
    const p = this.particles;
    const t = Math.min(p.spTime[i] / p.spDuration[i], 1);
    const e = p.flags[i] & QUICK ? easeOutCubic(t) : easeInOutCubic(t);
    const u = 1 - e;
    const x = u * u * p.spStartX[i] + 2 * u * e * p.spCtrlX[i] + e * e * p.spTargetX[i];
    const y = u * u * p.spStartY[i] + 2 * u * e * p.spCtrlY[i] + e * e * p.spTargetY[i];
    p.vx[i] = (x - p.x[i]) / dt;
    p.vy[i] = (y - p.y[i]) / dt;
    p.x[i] = x;
    p.y[i] = y;
    if (t >= 1) this.arrive(i);
  }

  /** Force-driven spiral that widens with time, then homes in. */
  private stepSpiral(i: number): void {
    const p = this.particles;
    const duration = p.spDuration[i];
    const e = easeInOutCubicStepped(Math.min(p.spTime[i] / duration, 1));
    const angle = e * duration;
    const reach = p.spRadius[i] * angle;
    let tx = p.spStartX[i] + reach * Math.cos(angle);
    let ty = p.spStartY[i] + reach * Math.sin(angle);
    tx += e * (p.spTargetX[i] - tx);
    ty += e * (p.spTargetY[i] - ty);

    if (e >= 1) {
      p.vx[i] *= SPIRAL.settleDamping;
      p.vy[i] *= SPIRAL.settleDamping;
    }
    p.fx[i] += (tx - p.x[i]) * SPIRAL.stiffness;
    p.fy[i] += (ty - p.y[i]) * SPIRAL.stiffness;

    const snap = SPIRAL.snapDistance;
    if (Math.abs(p.x[i] - p.spTargetX[i]) < snap && Math.abs(p.y[i] - p.spTargetY[i]) < snap) this.arrive(i);
  }

  private stepPhysics(dt: number): void {
    const gravity = this.gravity;
    gravity.build(this.wells.filter((w) => w.layer === MAIN_LAYER));
    const ambient = this.ambientGravity;
    ambient.build(this.wells.filter((w) => w.layer === AMBIENT_LAYER));
    const hasGravity = !gravity.empty;
    const p = this.particles;
    const flightOwnsPosition = FLIGHT.style === 'arc';

    const pull = this.cursorActive;
    const cx = this.cursorX;
    const cy = this.cursorY;
    const pullR = CURSOR.radius;
    const pullR2 = pullR * pullR;

    for (let i = 0; i < p.end; i++) {
      const flags = p.flags[i];
      if (!(flags & ALIVE)) continue;
      if (flightOwnsPosition && flags & SPIRALING) continue;
      let fx = p.fx[i];
      let fy = p.fy[i];
      let damping = p.damping[i];
      if (p.layer[i] !== MAIN_LAYER) {
        ambient.sample(p.x[i], p.y[i]);
        fx += ambient.ax;
        fy += ambient.ay;
      } else if (flags & GRAVITATABLE) {
        if (hasGravity) {
          gravity.sample(p.x[i], p.y[i]);
          fx += gravity.ax;
          fy += gravity.ay;
        }
        if (pull) {
          const dx = cx - p.x[i];
          const dy = cy - p.y[i];
          const d2 = dx * dx + dy * dy;
          if (d2 < pullR2 && d2 > 0) {
            const d = Math.sqrt(d2);
            const f = (CURSOR.strength * (1 - d / pullR)) / d;
            fx += f * dx;
            fy += f * dy;
            damping *= CURSOR.drag;
          }
        }
      }
      if (flags & FIX_ACTIVE) {
        fx += (p.fixX[i] - p.x[i]) * p.fixK[i];
        fy += (p.fixY[i] - p.y[i]) * p.fixK[i];
      }
      const vx = (p.vx[i] + fx * dt) * damping;
      const vy = (p.vy[i] + fy * dt) * damping;
      p.vx[i] = vx;
      p.vy[i] = vy;
      p.fx[i] = p.fy[i] = 0;
      p.x[i] += vx * dt;
      p.y[i] += vy * dt;
    }

    for (const well of this.wells) {
      well.vx *= WELL.damping;
      well.vy *= WELL.damping;
      well.x = wrap(well.x + well.vx * dt, this.width);
      well.y = well.wrapTop + wrap(well.y + well.vy * dt - well.wrapTop, this.height);
    }

    for (const bomb of this.bombs) {
      if (!bomb.flying) continue;
      if (hasGravity) {
        gravity.sample(bomb.x, bomb.y);
        bomb.vx += gravity.ax * dt;
        bomb.vy += gravity.ay * dt;
      }
      bomb.vx *= BOMB.damping;
      bomb.vy *= BOMB.damping;
      bomb.x = wrap(bomb.x + bomb.vx * dt, this.width);
      bomb.y = bomb.wrapTop + wrap(bomb.y + bomb.vy * dt - bomb.wrapTop, this.height);
    }
  }

  private detonate(): void {
    for (let b = this.bombs.length - 1; b >= 0; b--) {
      const bomb = this.bombs[b];
      if (!bomb.flying || !bomb.triggered) continue;
      this.bombs.splice(b, 1);

      const radius = BOMB.blastRadius;
      const r2 = radius * radius;
      const speedX = Math.abs(bomb.vx);
      const speedY = Math.abs(bomb.vy);
      // Pushes away from the blast, biased along the bomb's own travel.
      const blast = (x: number, y: number): [number, number] => {
        const dx = x - bomb.x + bomb.vx;
        const dy = y - bomb.y + bomb.vy;
        const len = Math.hypot(dx, dy) || 1;
        return [(dx / len) * speedX * randomRange(0.5, 1), (dy / len) * speedY * randomRange(0.5, 1)];
      };

      const p = this.particles;
      const hit = (i: number) => {
        [p.vx[i], p.vy[i]] = blast(p.x[i], p.y[i]);
        p.clearFix(i);
        p.clearLink(i);
        p.flags[i] &= ~SPIRALING;
      };
      for (let i = 0; i < p.end; i++) {
        if (!(p.flags[i] & ALIVE) || p.layer[i] !== MAIN_LAYER) continue;
        if ((p.x[i] - bomb.x) ** 2 + (p.y[i] - bomb.y) ** 2 <= r2) {
          hit(i);
          continue;
        }
        // Long segments can cross the blast with both ends outside it.
        if (!(p.flags[i] & LINKED)) continue;
        const n = p.link[i];
        if (n === i || !p.isAlive(n, p.linkGen[i])) continue;
        if (distanceToSegment(bomb.x, bomb.y, p.x[i], p.y[i], p.x[n], p.y[n]) <= radius) {
          hit(i);
          hit(n);
        }
      }
      const bodies: { x: number; y: number; vx: number; vy: number }[] = [
        ...this.wells.filter((well) => well.layer === MAIN_LAYER),
        ...this.bombs.filter((other) => other.flying),
      ];
      for (const body of bodies) {
        if ((body.x - bomb.x) ** 2 + (body.y - bomb.y) ** 2 <= r2) [body.vx, body.vy] = blast(body.x, body.y);
      }
      for (let k = 0; k < SPARKS.count; k++) {
        this.sparks.push({
          cx: bomb.x,
          cy: bomb.y,
          angle: Math.random() * Math.PI * 2,
          reach: radius * randomRange(SPARKS.minReach, SPARKS.maxReach),
          spin: randomSign() * SPARKS.spin * randomRange(0.5, 1),
          age: 0,
        });
      }
      if (!this.calm) this.shakeTime = SHAKE.duration;
    }
  }

  private updateShake(dt: number): void {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const strength = SHAKE.amplitude * (this.shakeTime / SHAKE.duration) ** 2;
      this.shakeX = randomRange(-strength, strength);
      this.shakeY = randomRange(-strength, strength);
    } else {
      this.shakeX = this.shakeY = 0;
    }
  }

  private drawEmitters(batch: DrawBatch): void {
    const c = EMITTER.barColor;
    const half = EMITTER.barWidth / 2;
    for (const e of this.emitters.values()) {
      if (e.visible) batch.line(e.x - half, e.y, e.x + half, e.y, c.r, c.g, c.b, c.r, c.g, c.b, EMITTER.barAlpha);
    }
  }

  private drawWells(batch: DrawBatch, onTop: boolean): void {
    const c = WELL.color;
    for (const well of this.wells) {
      if (well.onTop === onTop && !well.hidden) batch.point(well.x, well.y, c.r, c.g, c.b, WELL.size);
    }
  }

  private drawBombs(batch: DrawBatch): void {
    const a = TRAIL.startColor;
    const z = TRAIL.endColor;
    for (const bomb of this.bombs) {
      const t = bomb.trail;
      const segments = t.length / 2 - 1;
      for (let k = 0; k < segments; k++) {
        const x0 = t[k * 2];
        const y0 = t[k * 2 + 1];
        const x1 = t[k * 2 + 2];
        const y1 = t[k * 2 + 3];
        // Skip the jump where the bomb wrapped around the screen.
        if (Math.abs(x1 - x0) > this.width / 2 || Math.abs(y1 - y0) > this.height / 2) continue;
        const age = (k + 1) / segments;
        batch.line(x0, y0, x1, y1, z.r, z.g, z.b, a.r, a.g, a.b, age);
      }
      batch.point(bomb.x, bomb.y, BOMB.color.r, BOMB.color.g, BOMB.color.b, BOMB.size);
      if (!bomb.flying) {
        const s = BOMB.aimStartColor;
        const e = BOMB.aimEndColor;
        batch.line(bomb.x, bomb.y, bomb.anchorX, bomb.anchorY, s.r, s.g, s.b, e.r, e.g, e.b, 1);
      }
    }
  }

  /**
   * Radius follows two half parabolas meeting at the reach, like a ball under a
   * constant pull: zero speed only at the turn, fastest on the way back in.
   */
  private sparkAt(s: Spark, age: number): { x: number; y: number; alpha: number } {
    const t = Math.min(Math.max(age / SPARKS.life, 0), 1);
    const p = SPARKS.outPortion;
    const k = t < p ? (p - t) / p : (t - p) / (1 - p);
    const r = s.reach * (1 - k * k);
    const angle = s.angle + s.spin * t;
    return { x: s.cx + Math.cos(angle) * r, y: s.cy + Math.sin(angle) * r, alpha: t < p ? 1 : r / s.reach };
  }

  private drawSparks(batch: DrawBatch): void {
    const c = SPARKS.color;
    for (const s of this.sparks) {
      const head = this.sparkAt(s, s.age);
      const tail = this.sparkAt(s, s.age - SPARKS.trail);
      batch.line(tail.x, tail.y, head.x, head.y, c.r, c.g, c.b, c.r, c.g, c.b, 0, head.alpha);
      batch.glow.push(head.x, head.y, c.r, c.g, c.b, head.alpha, SPARKS.size);
    }
  }

  private drawParticles(dt: number, batch: DrawBatch): void {
    const p = this.particles;
    const triggerDistance = BOMB.triggerDistance;
    const armed = this.bombs.filter((bomb) => bomb.flying && !bomb.triggered);
    const focusClip = this.focus.clip;
    const unfocused = 1 - this.focus.level;

    for (let i = 0; i < p.end; i++) {
      const flags = p.flags[i];
      if (!(flags & ALIVE)) continue;

      if (flags & COLOR_FADING) fadeColorStep(p, i, p.fadeSpeed[i] * dt);
      const c = p.clip[i];
      const fade = c === focusClip ? 1 : unfocused;
      if (fade <= 0) continue;
      if (c) {
        const r = this.clips[c];
        const x = p.x[i];
        const y = p.y[i];
        if (x < r.x || y < r.y || x > r.x + r.width || y > r.y + r.height) continue;
      }
      const size = flags & ROUND ? -p.size[i] : p.size[i];
      (flags & GLOW ? batch.glow : batch.points).push(p.x[i], p.y[i], p.r[i], p.g[i], p.b[i], p.alpha[i] * fade, size);

      if ((flags & (LINKED | SPIRALING)) !== LINKED) continue;
      const n = p.link[i];
      if (n === i || !p.isAlive(n, p.linkGen[i]) || (p.flags[n] & (LINKED | SPIRALING)) !== LINKED) continue;

      // Lines only fade while both ends are settled.
      let alpha = p.linkAlpha[i] + p.linkAccel[i] * dt;
      if (alpha > 1) alpha = 1;
      if (alpha <= 0) {
        p.clearLink(i);
        continue;
      }
      p.linkAlpha[i] = alpha;

      for (const bomb of armed) {
        if (!bomb.triggered && distanceToSegment(bomb.x, bomb.y, p.x[i], p.y[i], p.x[n], p.y[n]) < triggerDistance) {
          bomb.triggered = true;
        }
      }
      batch.line(p.x[i], p.y[i], p.x[n], p.y[n], p.r[i], p.g[i], p.b[i], p.r[n], p.g[n], p.b[n], alpha * fade);
    }
  }
}

function fadeColorStep(p: ParticleStore, i: number, step: number): void {
  const dr = p.tr[i] - p.r[i];
  const dg = p.tg[i] - p.g[i];
  const db = p.tb[i] - p.b[i];
  const dist = Math.hypot(dr, dg, db);
  if (dist <= 1 || dist <= step) {
    p.r[i] = p.tr[i];
    p.g[i] = p.tg[i];
    p.b[i] = p.tb[i];
    p.flags[i] &= ~COLOR_FADING;
    return;
  }
  const t = step / dist;
  p.r[i] += dr * t;
  p.g[i] += dg * t;
  p.b[i] += db * t;
}

function removeWhere<T>(items: T[], predicate: (item: T) => boolean): void {
  let w = 0;
  for (const item of items) if (!predicate(item)) items[w++] = item;
  items.length = w;
}
