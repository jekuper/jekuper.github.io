import { useEffect, useState, type RefObject } from 'react';

/** True while the vertical center of `target` is above the center of `marker`. */
export function useScrolledPast(target: RefObject<HTMLElement | null>, marker: RefObject<HTMLElement | null>): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      if (!target.current || !marker.current) return;
      const t = target.current.getBoundingClientRect();
      const m = marker.current.getBoundingClientRect();
      setPast(t.top + t.height / 2 < m.top + m.height / 2);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [target, marker]);

  return past;
}
