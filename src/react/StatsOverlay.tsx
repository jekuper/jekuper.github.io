import { useEffect, useState } from 'react';
import type { EngineStats } from '../engine';
import { useEngine } from './engineContext';

const REFRESH_MS = 500;

/** Engine numbers in a corner, shown with `?stats` in the URL. */
export function StatsOverlay() {
  const engine = useEngine();
  const [stats, setStats] = useState<EngineStats | null>(null);

  useEffect(() => {
    if (!engine) return;
    const timer = window.setInterval(() => setStats(engine.stats), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [engine]);

  if (!stats) return null;
  const cpu = stats.simulationMs + stats.frameMs + stats.drawMs;
  return (
    <pre className="stats-overlay" data-fps={stats.fps.toFixed(1)}>
      {`fps   ${stats.fps.toFixed(1)}
cpu   ${cpu.toFixed(2)} ms
 sim  ${stats.simulationMs.toFixed(2)} ms
 fill ${stats.frameMs.toFixed(2)} ms
 draw ${stats.drawMs.toFixed(2)} ms
dots  ${stats.dots}
lines ${stats.lines}`}
    </pre>
  );
}

export const statsEnabled = () => new URLSearchParams(window.location.search).has('stats');
