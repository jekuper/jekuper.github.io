import { useSyncExternalStore } from 'react';
import type { Layout } from '../content/types';

export const MOBILE_QUERY = '(max-width: 1200px)';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

export function useLayout(): Layout {
  return useMediaQuery(MOBILE_QUERY) ? 'mobile' : 'desktop';
}

export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}

/** True for a mouse or trackpad; the engine is only interactive then. Width does not matter. */
export function useFinePointer(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}
