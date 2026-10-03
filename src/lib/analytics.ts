/** Visitor's answer to the metrics toast; null until they pick one. */
export type Consent = 'accepted' | 'declined';

const STORAGE_KEY = 'metrics-consent';

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

export function storedConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    return null;
  }
}

export function storeConsent(consent: Consent): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    // Without storage the toast asks again next visit, which is the safe side.
  }
}

/** Loads Microsoft Clarity and grants it consent. Only called after the visitor agreed. */
export function startClarity(projectId: string): void {
  if (window.clarity) return;
  const queue: unknown[][] = [];
  window.clarity = Object.assign((...args: unknown[]) => void queue.push(args), { q: queue });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  document.head.appendChild(script);
  window.clarity('consent');
}
