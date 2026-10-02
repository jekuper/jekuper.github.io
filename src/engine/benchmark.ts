import { FIXED_DT } from './config';
import { DrawBatch } from './renderer';
import { World } from './simulation';

const SAMPLE_DOTS = 6000;
const SAMPLE_WELLS = 6;
const WARMUP_FRAMES = 4;
const MEASURED_FRAMES = 8;

/**
 * Measures simulation cost on this device and returns how many field dots fit
 * in `budgetMs` of CPU time per frame. Takes a few tens of milliseconds.
 */
export function estimateDotBudget(budgetMs: number): number {
  const world = new World();
  world.setBounds(1600, 900);
  world.seedField('bench', { x: 800, y: 9, width: 784, height: 882 }, SAMPLE_DOTS, 2000);
  for (let k = 0; k < SAMPLE_WELLS; k++) world.addWell(Math.random() * 1600, Math.random() * 900, 20000, true);
  const batch = new DrawBatch();
  const frame = () => {
    world.fixedStep(FIXED_DT);
    world.frame(FIXED_DT, batch);
  };
  for (let k = 0; k < WARMUP_FRAMES; k++) frame();
  const start = performance.now();
  for (let k = 0; k < MEASURED_FRAMES; k++) frame();
  const perDot = (performance.now() - start) / MEASURED_FRAMES / SAMPLE_DOTS;
  return Math.floor(budgetMs / Math.max(perDot, 1e-6));
}
