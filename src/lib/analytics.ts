declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Sends a named Clarity event, so recordings can be filtered by what visitors did;
 * tags add detail such as which project. Clarity cannot see the canvas itself.
 */
export function track(event: string, tags: Record<string, string> = {}): void {
  const clarity = window.clarity;
  if (!clarity) return;
  for (const [key, value] of Object.entries(tags)) clarity('set', key, value);
  clarity('event', event);
}
