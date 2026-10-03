import type { DotIcon } from '../content/types';

/** Stroked SVG paths in a 24 x 24 box for DotText; a zero-length segment draws a round dot. */
export const DOT_ICONS: Record<DotIcon, string> = {
  briefcase:
    'M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z' +
    'M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18M12 12v2',
  blocks: 'M3 14h8v6H3zM13 14h8v6h-8zM8 4h8v6H8z',
  gamepad:
    'M7 8h10a5 5 0 0 1 5 5v1a3 3 0 0 1-5.4 1.8L15 14H9l-1.6 1.8A3 3 0 0 1 2 14v-1a5 5 0 0 1 5-5z' +
    'M7 10.5v3M5.5 12h3M15.5 11h.01M18 13h.01',
  smile: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8.5 9.5v.01M15.5 9.5v.01M8 14a5 5 0 0 0 8 0',
  envelope: 'M3 6h18v12H3zM3 6l9 7l9-7',
};
