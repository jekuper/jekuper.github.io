import type { LineArt } from './art';
import { FIXED_DT, MAX_FRAME_DT } from './config';
import { MouseControls } from './input';
import type { Rgb } from './math';
import { DrawBatch, Renderer } from './renderer';
import { World, type Point, type Rect } from './simulation';

/** Placement of a line art, in CSS pixels relative to the canvas. */
export interface MorphRequest {
  art: LineArt;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  color: Rgb;
  density: number;
  holdTime?: number;
}

/**
 * Public face of the engine. Owns the canvas, the loop and the world. All
 * coordinates in this API are CSS pixels relative to the canvas.
 */
export class Engine {
  readonly world = new World();
  private renderer: Renderer;
  private batch = new DrawBatch();
  private controls: MouseControls | null = null;
  private emitterAnchor: () => Point | null = () => null;
  private visibility: IntersectionObserver;
  private onScreen = true;
  private frameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.world.locateEmitter = () => this.locateEmitter();
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

  get pixelRatio(): number {
    return this.dpr;
  }

  /** Canvas size in CSS pixels. */
  get size(): { width: number; height: number } {
    return { width: this.canvas.clientWidth, height: this.canvas.clientHeight };
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
    this.world.setBounds(width, height);
    this.renderer.resize(width, height);
    return true;
  }

  setInteractive(interactive: boolean): void {
    if (interactive && !this.controls) this.controls = new MouseControls(this.canvas, this.world);
    if (!interactive && this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
  }

  /** Where new dots come from and retired dots go, in canvas CSS pixels. */
  setEmitterAnchor(anchor: () => Point | null): void {
    this.emitterAnchor = anchor;
  }

  clear(): void {
    this.world.clear();
  }

  seedField(group: string, rect: Rect, count: number, wellMagnitude: number): void {
    const d = this.dpr;
    this.world.seedField(group, { x: rect.x * d, y: rect.y * d, width: rect.width * d, height: rect.height * d }, count, wellMagnitude);
  }

  morph(group: string, request: MorphRequest): void {
    const d = this.dpr;
    const { art } = request;
    this.world.morph(group, {
      art,
      originX: (request.centerX - request.width / 2) * d,
      originY: (request.centerY - request.height / 2) * d,
      scaleX: (request.width / art.width) * d,
      scaleY: (request.height / art.height) * d,
      color: request.color,
      density: request.density,
      holdTime: request.holdTime ?? Infinity,
    });
  }

  release(group: string): void {
    this.world.release(group);
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.setInteractive(false);
    this.visibility.disconnect();
    document.removeEventListener('visibilitychange', this.updateRunning);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.renderer.dispose();
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
    const dt = Math.min(Math.max(0, now - this.lastTime) / 1000, MAX_FRAME_DT);
    this.lastTime = now;
    this.accumulator += dt;
    while (this.accumulator >= FIXED_DT) {
      this.world.fixedStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }
    this.world.frame(dt, this.batch);
    this.renderer.draw(this.batch, this.world.shakeX, this.world.shakeY);
  };

  private locateEmitter(): Point {
    const p = this.emitterAnchor();
    if (!p) return { x: this.world.width / 2, y: this.world.height / 2 };
    return { x: p.x * this.dpr, y: p.y * this.dpr };
  }

  private onContextLost = (e: Event) => e.preventDefault();

  private onContextRestored = () => {
    this.renderer.init();
    this.renderer.resize(this.canvas.width, this.canvas.height);
  };
}
