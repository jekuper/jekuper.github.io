/** Visitor's answer to the metrics toast. */
export type Consent = 'accepted' | 'declined';

// Also read by the Clarity snippet in index.html, which applies a stored answer before the app starts.
const STORAGE_KEY = 'metrics-consent';

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
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

/** Tells Clarity whether it may use cookies; without them it still records, with less detail. */
export function sendConsent(consent: Consent): void {
  window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: consent === 'accepted' ? 'granted' : 'denied' });
}
