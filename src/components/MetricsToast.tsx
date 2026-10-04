import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { MetricsData } from '../content/types';
import { MOBILE_QUERY } from '../hooks/useMediaQuery';
import { metricsEnabled, sendConsent, storeConsent, storedConsent, type Consent } from '../lib/analytics';
import './MetricsToast.css';

// Waits until the hero has drawn itself, so the toast is not the first thing seen.
const SHOW_DELAY_MS = 2500;
// On phones the name sits where the toast goes, so it also waits until the first screen is scrolled past.
const PHONE_SCROLL_FRACTION = 1;

/** Asks once, in a corner, whether usage metrics may use cookies; the answer is passed to Clarity. */
export function MetricsToast({ data }: { data: MetricsData }) {
  // Nothing to ask about where metrics are off, such as the dev server.
  const [phase, setPhase] = useState<'waiting' | 'asking' | 'answered'>(() =>
    !metricsEnabled() || storedConsent() ? 'answered' : 'waiting',
  );

  // Listens only while waiting, so nothing can bring the toast back once it was shown.
  useEffect(() => {
    if (phase !== 'waiting') return;
    let waited = false;
    const phone = window.matchMedia(MOBILE_QUERY).matches;
    const scrolledEnough = () => !phone || window.scrollY > window.innerHeight * PHONE_SCROLL_FRACTION;
    const check = () => {
      if (waited && scrolledEnough()) setPhase('asking');
    };
    const timer = window.setTimeout(() => {
      waited = true;
      check();
    }, SHOW_DELAY_MS);
    window.addEventListener('scroll', check, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', check);
    };
  }, [phase]);

  const answer = (consent: Consent) => {
    storeConsent(consent);
    sendConsent(consent);
    setPhase('answered');
  };

  return (
    <AnimatePresence>
      {phase === 'asking' && (
        <motion.aside
          className="metrics-toast"
          role="dialog"
          aria-label="Usage metrics"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <p>{data.message}</p>
          <div className="metrics-toast-actions">
            <button type="button" className="metrics-toast-decline" onClick={() => answer('declined')}>
              {data.declineLabel}
            </button>
            <button type="button" className="metrics-toast-accept" onClick={() => answer('accepted')}>
              {data.acceptLabel}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
