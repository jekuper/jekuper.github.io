import type { LineArt } from './art';
import { createBomb, createWell, type Bomb, type Well } from './bodies';
import { BOMB, EMITTER, ERASER, LINK, MORPH, PARTICLE, SHAKE, SPIRAL, WELL } from './config';
import { GravityField } from './gravity';
import { distanceToSegment, easeInOutCubicStepped, randomRange, randomSign, wrap, type Rgb } from './math';
import {
  ALIVE,
  ARRIVE_DESTROY,
  ARRIVE_FIX,
  COLOR_FADING,
  FIX_ACTIVE,
  GRAVITATABLE,
  HAS_FIX,
  LINKED,
  ParticleStore,
  SPIRALING,
} from './particles';
import type { DrawBatch } from './renderer';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where and how a group draws a line art. Units are device pixels. */
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
}

type Phase = 'fading' | 'forming' | 'holding' | 'dissolving';

interface Group {
  slots: number[];
  gens: number[];
  phase: Phase;
  timer: number;
  target: MorphTarget | null;
}

export interface Point {
  x: number;
  y: number;
}

/** All simulation state. Knows nothing about the DOM. */
export class World {
  readonly particles = new ParticleStore();
  readonly wells: Well[] = [];
  readonly bombs: Bomb[] = [];
  width = 1;
  height = 1;
  cursorX = -1000;
  cursorY = -1000;
  eraserVisible = false;
  shakeX = 0;
  shakeY = 0;
  /** Supplies the emitter position on demand; particles spawn and retire there. */
  locateEmitter: () => Point = () => ({ x: this.width / 2, y: this.height / 2 });

  private groups = new Map<string, Group>();
  private gravity = new GravityField();
  private shakeTime = 0;

  setBounds(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  clear(): void {
    this.particles.clear();
    this.wells.length = 0;
    this.bombs.length = 0;
    this.groups.clear();
    this.shakeTime = 0;
    this.eraserVisible = false;
  }

  addWell(x: number, y: number, magnitude: number, onTop: boolean): Well {
    const well = createWell(x, y, magnitude, onTop);
    this.wells.push(well);
    return well;
  }

  /** A grid of drifting dots with a well in each corner of `rect`. */
  seedField(name: string, rect: Rect, count: number, wellMagnitude: number): void {
    for (const fy of [0, 1]) {
      for (const fx of [0, 1]) {
        this.addWell(rect.x + fx * rect.width, rect.y + fy * rect.height, wellMagnitude, false);
      }
    }
    const columns = Math.floor(Math.sqrt((count * rect.width) / rect.height));
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
      p.setColor(i, PARTICLE.fieldColor);
      slots.push(i);
    }
    this.groups.set(name, {
      slots,
      gens: slots.map((i) => p.gen[i]),
      phase: 'holding',
      timer: Infinity,
      target: null,
    });
  }

  /** Re-forms the group's dots into `target`, spawning or retiring dots as needed. */
  morph(name: string, target: MorphTarget): void {
    let group = this.groups.get(name);
    if (!group) {
      group = { slots: [], gens: [], phase: 'fading', timer: 0, target };
      this.groups.set(name, group);
    }
    group.target = target;
    group.phase = 'fading';
    group.timer = 0;
    const p = this.particles;
    this.forEachMember(group, (i) => {
      if (p.flags[i] & LINKED && p.linkAccel[i] > 0) {
        p.setLinkAccel(i, LINK.fadeOut);
        group.timer = MORPH.fadeOutTime;
      }
    });
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

  /** Releases the group, then sends its dots back into the emitter. */
  dissolve(name: string): void {
    const group = this.groups.get(name);
    if (!group || group.phase === 'dissolving') return;
    this.release(name);
    group.phase = 'dissolving';
    group.timer = MORPH.dissolveTime;
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
    bomb.vx += impulseX;
    bomb.vy += impulseY;
  }

  eraseAtCursor(): void {
    const r2 = ERASER.radius * ERASER.radius;
    const cx = this.cursorX;
    const cy = this.cursorY;
    const p = this.particles;
    for (let i = 0; i < p.end; i++) {
      if (p.flags[i] & ALIVE && (p.x[i] - cx) ** 2 + (p.y[i] - cy) ** 2 <= r2) p.destroy(i);
    }
    const near = (b: { x: number; y: number }) => (b.x - cx) ** 2 + (b.y - cy) ** 2 <= r2;
    removeWhere(this.wells, near);
    removeWhere(this.bombs, near);
  }

  fixedStep(dt: number): void {
    this.stepGroups(dt);
    this.stepSpirals(dt);
    this.stepPhysics(dt);
    this.detonate();
  }

  /** Per-frame work: follow the cursor, fade colors and lines, fill the draw batch. */
  frame(dt: number, batch: DrawBatch): void {
    for (const bomb of this.bombs) {
      if (!bomb.flying) {
        bomb.x = this.cursorX;
        bomb.y = this.cursorY;
      }
    }
    this.updateShake(dt);

    batch.reset();
    if (this.eraserVisible) {
      const c = ERASER.color;
      batch.point(this.cursorX, this.cursorY, c.r, c.g, c.b, ERASER.radius);
    }
    this.drawWells(batch, false);
    this.drawParticles(dt, batch);
    this.drawWells(batch, true);
    for (const bomb of this.bombs) {
      batch.point(bomb.x, bomb.y, BOMB.color.r, BOMB.color.g, BOMB.color.b, BOMB.size);
      if (!bomb.flying) {
        const a = BOMB.aimStartColor;
        const b = BOMB.aimEndColor;
        batch.line(bomb.x, bomb.y, bomb.anchorX, bomb.anchorY, a.r, a.g, a.b, b.r, b.g, b.b, 1);
      }
    }
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
        case 'holding':
          group.timer -= dt;
          if (group.timer <= 0) this.dissolve(name);
          break;
        case 'dissolving':
          group.timer -= dt;
          if (group.timer <= 0) {
            this.forEachMember(group, (i) => this.retire(i));
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
    while (members.length > art.pointCount) this.retire(members.pop()!);

    const order: number[] = [];
    for (let k = members.length; k < art.pointCount; k++) order.push(this.spawnAtEmitter(target.color));
    order.push(...members);

    for (let c = 0; c < art.contourCount; c++) {
      const start = art.starts[c];
      const end = art.starts[c + 1];
      for (let k = start; k < end; k++) {
        const i = order[k];
        const x = art.x[k] * target.scaleX + target.originX;
        const y = art.y[k] * target.scaleY + target.originY;
        const duration = Math.round(SPIRAL.minDuration + Math.random() * SPIRAL.durationRange);

        p.setLink(i, order[k + 1 < end ? k + 1 : start], LINK.fadeIn);
        p.setFix(i, x, y, target.density, false);
        if (target.density < 0) p.flags[i] &= ~GRAVITATABLE;
        else p.flags[i] |= GRAVITATABLE;

        const r = art.rgb[k * 3];
        const g = art.rgb[k * 3 + 1];
        const b = art.rgb[k * 3 + 2];
        if (r || g || b) p.fadeColor(i, { r, g, b }, SPIRAL.artColorFade);
        else p.fadeColor(i, target.color, duration);

        const radius = randomSign() * (SPIRAL.minRadius + Math.random() * SPIRAL.radiusRange);
        p.spiralTo(i, radius, x, y, duration, ARRIVE_FIX);
      }
    }

    group.slots = order;
    group.gens = order.map((i) => p.gen[i]);
    group.phase = 'forming';
  }

  private spawnAtEmitter(color: Rgb): number {
    const e = this.locateEmitter();
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

  /** Spirals a dot into the emitter, then frees it. */
  private retire(i: number): void {
    const e = this.locateEmitter();
    const p = this.particles;
    p.clearLink(i);
    p.clearFix(i);
    const x = randomRange(e.x - EMITTER.width / 2, e.x + EMITTER.width / 2);
    p.spiralTo(i, p.spRadius[i], x, e.y, p.spDuration[i], ARRIVE_DESTROY);
  }

  private forEachMember(group: Group, fn: (slot: number) => void): void {
    const p = this.particles;
    for (let k = 0; k < group.slots.length; k++) {
      if (p.isAlive(group.slots[k], group.gens[k])) fn(group.slots[k]);
    }
  }

  private stepSpirals(dt: number): void {
    const p = this.particles;
    const snap = SPIRAL.snapDistance;
    for (let i = 0; i < p.end; i++) {
      if ((p.flags[i] & (ALIVE | SPIRALING)) !== (ALIVE | SPIRALING)) continue;
      if (p.spTime[i] === 0) {
        p.spStartX[i] = p.x[i];
        p.spStartY[i] = p.y[i];
      }
      p.spTime[i] += dt;
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

      if (Math.abs(p.x[i] - p.spTargetX[i]) < snap && Math.abs(p.y[i] - p.spTargetY[i]) < snap) {
        p.x[i] = p.spTargetX[i];
        p.y[i] = p.spTargetY[i];
        p.vx[i] = p.vy[i] = p.fx[i] = p.fy[i] = 0;
        p.flags[i] &= ~SPIRALING;
        if (p.onArrive[i] === ARRIVE_FIX && p.flags[i] & HAS_FIX) p.flags[i] |= FIX_ACTIVE;
        else if (p.onArrive[i] === ARRIVE_DESTROY) p.destroy(i);
      }
    }
  }

  private stepPhysics(dt: number): void {
    const gravity = this.gravity;
    gravity.build(this.wells);
    const hasGravity = !gravity.empty;
    const p = this.particles;

    for (let i = 0; i < p.end; i++) {
      const flags = p.flags[i];
      if (!(flags & ALIVE)) continue;
      let fx = p.fx[i];
      let fy = p.fy[i];
      if (hasGravity && flags & GRAVITATABLE) {
        gravity.sample(p.x[i], p.y[i]);
        fx += gravity.ax;
        fy += gravity.ay;
      }
      if (flags & FIX_ACTIVE) {
        fx += (p.fixX[i] - p.x[i]) * p.fixK[i];
        fy += (p.fixY[i] - p.y[i]) * p.fixK[i];
      }
      const damping = p.damping[i];
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
      well.y = wrap(well.y + well.vy * dt, this.height);
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
      bomb.y = wrap(bomb.y + bomb.vy * dt, this.height);
    }
  }

  private detonate(): void {
    for (let b = this.bombs.length - 1; b >= 0; b--) {
      const bomb = this.bombs[b];
      if (!bomb.flying || !bomb.triggered) continue;
      this.bombs.splice(b, 1);

      const r2 = BOMB.blastRadius * BOMB.blastRadius;
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
      for (let i = 0; i < p.end; i++) {
        if (!(p.flags[i] & ALIVE) || (p.x[i] - bomb.x) ** 2 + (p.y[i] - bomb.y) ** 2 > r2) continue;
        [p.vx[i], p.vy[i]] = blast(p.x[i], p.y[i]);
        p.clearFix(i);
        p.clearLink(i);
      }
      const bodies: { x: number; y: number; vx: number; vy: number }[] = [
        ...this.wells,
        ...this.bombs.filter((other) => other.flying),
      ];
      for (const body of bodies) {
        if ((body.x - bomb.x) ** 2 + (body.y - bomb.y) ** 2 <= r2) [body.vx, body.vy] = blast(body.x, body.y);
      }
      this.shakeTime = SHAKE.duration;
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

  private drawWells(batch: DrawBatch, onTop: boolean): void {
    const c = WELL.color;
    for (const well of this.wells) {
      if (well.onTop === onTop) batch.point(well.x, well.y, c.r, c.g, c.b, WELL.size);
    }
  }

  private drawParticles(dt: number, batch: DrawBatch): void {
    const p = this.particles;
    const triggerDistance = BOMB.triggerDistance;
    const armed = this.bombs.filter((bomb) => bomb.flying && !bomb.triggered);

    for (let i = 0; i < p.end; i++) {
      const flags = p.flags[i];
      if (!(flags & ALIVE)) continue;

      if (flags & COLOR_FADING) fadeColorStep(p, i, p.fadeSpeed[i] * dt);
      batch.point(p.x[i], p.y[i], p.r[i], p.g[i], p.b[i], p.size[i]);

      if ((flags & (LINKED | SPIRALING)) !== LINKED) continue;
      const n = p.link[i];
      if (!p.isAlive(n, p.linkGen[i]) || (p.flags[n] & (LINKED | SPIRALING)) !== LINKED) continue;

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
      batch.line(p.x[i], p.y[i], p.x[n], p.y[n], p.r[i], p.g[i], p.b[i], p.r[n], p.g[n], p.b[n], alpha);
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
