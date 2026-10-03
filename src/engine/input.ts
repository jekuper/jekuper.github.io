import type { Bomb } from './bodies';
import { BOMB } from './config';
import type { World } from './simulation';

/**
 * Mouse controls: click for a black hole (ctrl for a repelling one), drag to
 * aim and throw a bomb, hold the right button to erase.
 */
export class MouseControls {
  private pressed = false;
  private erasing = false;
  private bomb: Bomb | null = null;
  private startX = 0;
  private startY = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private world: World,
  ) {
    canvas.addEventListener('contextmenu', this.onContextMenu);
    canvas.addEventListener('mousedown', this.onDown);
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp);
    document.documentElement.addEventListener('mouseleave', this.onLeave);
  }

  dispose(): void {
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('mousedown', this.onDown);
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('mouseup', this.onUp);
    document.documentElement.removeEventListener('mouseleave', this.onLeave);
    this.world.eraserVisible = false;
    this.world.cursorActive = false;
  }

  private onContextMenu = (e: MouseEvent) => e.preventDefault();

  private onLeave = () => {
    this.world.cursorActive = false;
  };

  private onDown = (e: MouseEvent) => {
    if (this.pressed) return;
    e.preventDefault();
    this.track(e);
    this.pressed = true;
    this.erasing = e.button === 2;
    this.world.eraserVisible = this.erasing;
    if (this.erasing) {
      this.world.eraseAtCursor();
    } else {
      this.startX = e.clientX;
      this.startY = e.clientY;
    }
  };

  private onMove = (e: MouseEvent) => {
    this.track(e);
    if (!this.pressed) return;
    const { cursorX, cursorY, camX, camY, width, height } = this.world;
    const vx = cursorX - camX;
    const vy = cursorY - camY;
    if (vx < 0 || vx > width || vy < 0 || vy > height) {
      this.onUp(e);
      return;
    }
    if (this.erasing) {
      this.world.eraseAtCursor();
    } else if (!this.bomb && Math.hypot(e.clientX - this.startX, e.clientY - this.startY) > BOMB.dragThreshold) {
      this.bomb = this.world.aimBomb();
    }
  };

  private onUp = (e: MouseEvent) => {
    if (!this.pressed) return;
    this.pressed = false;
    if (this.erasing) {
      this.erasing = false;
      this.world.eraserVisible = false;
    } else if (this.bomb) {
      const k = BOMB.launchScale;
      this.world.launchBomb(this.bomb, (this.startX - e.clientX) * k, (this.startY - e.clientY) * k);
      this.bomb = null;
    } else {
      this.world.spawnWellAtCursor(e.ctrlKey);
    }
  };

  // Viewport coordinates: the canvas may be taller than the viewport and offset from it.
  private track(e: MouseEvent): void {
    const dpr = this.canvas.width / Math.max(1, this.canvas.clientWidth);
    const x = e.clientX;
    const y = e.clientY;
    this.world.cursorX = x * dpr + this.world.camX;
    this.world.cursorY = y * dpr + this.world.camY;
    this.world.cursorActive = x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
  }
}
