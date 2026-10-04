import type { LineArt } from './art';
import { FIXED_DT, MAX_FRAME_DT } from './config';
import { MouseControls, type UserAction } from './input';
import type { Rgb } from './math';
import { DrawBatch, Renderer } from './renderer';
import { World, type FieldOptions, type GalaxyOptions, type Point, type Rect } from './simulation';

/** Rolling averages of the frame loop. Times are CPU milliseconds per frame. */
export interface EngineStats {
  fps: number;
  /** Fixed-step physics, flights and morphs. */
  simulationMs: number;
  /** Color fades, line fades and filling the vertex buffers. */
  frameMs: number;
  /** Uploading buffers and issuing draw calls (GPU work itself runs later). */
  drawMs: number;
  dots: number;
  lines: number;
}

const STATS_SMOOTHING = 0.05;

/** Placement of a line art, in world CSS pixels. */
export interface MorphRequest {
  art: LineArt;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  color: Rgb;
  density: number;
  holdTime?: number;
  /** Named emitter (see `setEmitter`) the dots come from and return to. */
  emitter?: string;
  /** Named clip region (see `defineClip`) the dots are drawn inside. */
  clip?: string;
  surplus?: 'retire' | 'release';
  /** Swap an already formed shape at once (see MorphTarget.quick). */
  quick?: boolean;
  afterHold?: 'dissolve' | 'release' | 'scatter';
}

export interface EngineOptions {
  /**
   * Canvas height as a multiple of the viewport height. Above 1 the page can
   * scroll the canvas itself (see `setCanvasOrigin`), which keeps the dots in
   * step with the page while the browser scrolls ahead of the next frame.
   */
  overscan?: number;
}

/**
 * Public face of the engine. Owns the canvas, the loop and the world.
 *
 * The canvas shows a viewport onto a larger world. World coordinates in this
 * API are CSS pixels; the camera says where the viewport currently is.
 */
export class Engine {
  readonly world = new World();
  private renderer: Renderer;
  private batch = new DrawBatch();
  private controls: MouseControls | null = null;
  private actionListener: (action: UserAction) => void = () => {};
  private camera: () => Point = () => ({ x: 0, y: 0 });
  private canvasOrigin: (() => number) | null = null;
  private overscan: number;
  private visibility: IntersectionObserver;
  private onScreen = true;
  private frameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private dpr = 1;
  private averages: EngineStats = { fps: 0, simulationMs: 0, frameMs: 0, drawMs: 0, dots: 0, lines: 0 };

  constructor(
    private canvas: HTMLCanvasElement,
    options: EngineOptions = {},
  ) {
    this.overscan = Math.max(1, options.overscan ?? 1);
    this.renderer = new Renderer(canvas);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    document.addEventListener('visibilitychange', this.updateRunning);
    this.visibility = new IntersectionObserver(([entry]) => {
      this.onScreen = entry.isIntersecting;
      this.updateRunning();
    });
    this.visibility.observe(canvas);
    this.resize();
    this.updateRunning();
  }

  get stats(): EngineStats {
    return { ...this.averages };
  }

  get pixelRatio(): number {
    return this.dpr;
  }

  /** Viewport size in CSS pixels. */
  get size(): { width: number; height: number } {
    return { width: this.canvas.clientWidth, height: this.canvas.clientHeight / this.overscan };
  }

  /** Matches the drawing buffer to the canvas' CSS size. Returns true if it changed. */
  resize(): boolean {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (width === this.canvas.width && height === this.canvas.height && dpr === this.dpr) return false;
    this.dpr = dpr;
    this.canvas.width = width;
    this.canvas.height = height;
    this.world.setBounds(width, Math.round(height / this.overscan));
    this.renderer.resize(width, height);
    return true;
  }

  setInteractive(interactive: boolean): void {
    if (interactive && !this.controls) this.controls = new MouseControls(this.canvas, this.world, (a) => this.actionListener(a));
    if (!interactive && this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
  }

  /** Called when a visitor drops a black hole, throws a bomb or erases. */
  onAction(listener: (action: UserAction) => void): void {
    this.actionListener = listener;
  }

  /** Places a named spawn and return point for dots, in world CSS pixels. */
  setEmitter(name: string, at: Point, visible = true): void {
    this.world.setEmitter(name, at.x * this.dpr, at.y * this.dpr, visible);
  }

  /** Names a world rectangle (CSS pixels) that groups can be clipped to. */
  defineClip(name: string, rect: Rect): void {
    const d = this.dpr;
    this.world.defineClip(name, { x: rect.x * d, y: rect.y * d, width: rect.width * d, height: rect.height * d });
  }

  /** Calmer motion for visitors who ask for less of it; applies to scenes seeded afterwards too. */
  setReducedMotion(reduced: boolean): void {
    this.world.calm = reduced;
  }

  setWellColor(color: Rgb): void {
    this.world.wellColor = color;
  }

  /** Fades out every dot not drawn in the named clip; null brings them back. */
  focus(clip: string | null): void {
    this.world.setFocus(clip);
  }

  removeEmitter(name: string): void {
    this.world.removeEmitter(name);
  }

  /** Called every frame for the viewport's world position in CSS pixels. */
  setCamera(camera: () => Point): void {
    this.camera = camera;
    this.syncCamera();
  }

  /**
   * Called once per frame, before drawing, for the world y (CSS pixels) shown at
   * the canvas' top edge; the callback may move the canvas there. Without it the
   * canvas is the viewport.
   */
  setCanvasOrigin(origin: (() => number) | null): void {
    this.canvasOrigin = origin;
  }

  /** Converts a viewport position (e.g. from getBoundingClientRect) to world CSS pixels. */
  viewToWorld(x: number, y: number): Point {
    const c = this.camera();
    return { x: x + c.x, y: y + c.y };
  }

  clear(): void {
    this.world.clear();
  }

  removeGroup(group: string): void {
    this.world.removeGroup(group);
  }

  tint(group: string, color: Rgb, seconds: number): void {
    this.world.tint(group, color, seconds);
  }

  clearBodies(): void {
    this.world.clearBodies();
  }

  hasGroup(group: string): boolean {
    return this.world.hasGroup(group);
  }

  seedField(group: string, rect: Rect, count: number, wellMagnitude: number, options?: FieldOptions): void {
    const d = this.dpr;
    const deviceRect = { x: rect.x * d, y: rect.y * d, width: rect.width * d, height: rect.height * d };
    this.world.seedField(group, deviceRect, count, wellMagnitude, options);
  }

  /** A rotating spiral of dots that ignores the cursor, user wells and bombs. World CSS pixels. */
  seedGalaxy(group: string, center: Point, radius: number, count: number, magnitude: number, options: GalaxyOptions): void {
    const d = this.dpr;
    // Orbit speed is sqrt(magnitude), so the magnitude scales with the square of the pixel ratio.
    this.world.seedGalaxy(group, center.x * d, center.y * d, radius * d, count, magnitude * d * d, options);
  }

  morph(group: string, request: MorphRequest): void {
    const d = this.dpr;
    const { art } = request;
    this.world.morph(group, {
      art,
      originX: (request.centerX - request.width / 2) * d,
      originY: (request.centerY - request.height / 2) * d,
      scaleX: (request.width / Math.max(1, art.width)) * d,
      scaleY: (request.height / Math.max(1, art.height)) * d,
      color: request.color,
      density: request.density,
      holdTime: request.holdTime ?? Infinity,
      emitter: request.emitter,
      clip: request.clip,
      surplus: request.surplus,
      quick: request.quick,
      afterHold: request.afterHold,
    });
  }

  /** Translates a group by (dx, dy) CSS pixels. */
  moveGroup(group: string, dx: number, dy: number): void {
    this.world.moveGroup(group, dx * this.dpr, dy * this.dpr);
  }

  /** Shifts the group's free dots by varying fractions of (dx, dy), CSS pixels; see World.drift. */
  drift(group: string, dx: number, dy: number): void {
    this.world.drift(group, dx * this.dpr, dy * this.dpr);
  }

  release(group: string): void {
    this.world.release(group);
  }

  scatter(group: string, speed?: number): void {
    this.world.scatter(group, speed === undefined ? undefined : speed * this.dpr);
  }

  dissolve(group: string): void {
    this.world.dissolve(group);
  }

  recall(group: string): void {
    this.world.recall(group);
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.setInteractive(false);
    this.visibility.disconnect();
    document.removeEventListener('visibilitychange', this.updateRunning);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.renderer.dispose();
  }

  private syncCamera(): void {
    const c = this.camera();
    this.world.camX = c.x * this.dpr;
    this.world.camY = c.y * this.dpr;
  }

  private updateRunning = () => {
    const shouldRun = this.onScreen && !document.hidden;
    if (shouldRun && !this.frameId) {
      this.lastTime = performance.now();
      this.frameId = requestAnimationFrame(this.tick);
    } else if (!shouldRun && this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
  };

  private tick = (now: number) => {
    this.frameId = requestAnimationFrame(this.tick);
    const elapsed = Math.max(0, now - this.lastTime);
    const dt = Math.min(elapsed / 1000, MAX_FRAME_DT);
    this.lastTime = now;
    this.syncCamera();
    const t0 = performance.now();
    this.accumulator += dt;
    while (this.accumulator >= FIXED_DT) {
      this.world.fixedStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }
    const t1 = performance.now();
    const w = this.world;
    w.frame(dt, this.batch);
    const t2 = performance.now();
    const originY = this.canvasOrigin ? this.canvasOrigin() * this.dpr : w.camY;
    this.renderer.draw(this.batch, { x: w.camX, y: originY, shakeX: w.shakeX, shakeY: w.shakeY });
    const t3 = performance.now();
    this.record(elapsed, t1 - t0, t2 - t1, t3 - t2);
  };

  private record(elapsed: number, simulationMs: number, frameMs: number, drawMs: number): void {
    const a = this.averages;
    const k = STATS_SMOOTHING;
    if (elapsed > 0) a.fps += (1000 / elapsed - a.fps) * k;
    a.simulationMs += (simulationMs - a.simulationMs) * k;
    a.frameMs += (frameMs - a.frameMs) * k;
    a.drawMs += (drawMs - a.drawMs) * k;
    a.dots = this.world.particles.live;
    a.lines = this.batch.lineCount;
  }

  private onContextLost = (e: Event) => e.preventDefault();

  private onContextRestored = () => {
    this.renderer.init();
    this.renderer.resize(this.canvas.width, this.canvas.height);
  };
}
