import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { EngineHelp } from '../../content/types';

const variants = {
  visible: { opacity: 1, pointerEvents: 'auto' as const },
  hidden: { opacity: 0, pointerEvents: 'none' as const },
};

/** Explains the controls on touch layouts; tap anywhere to dismiss. */
export function TouchOverlay({ help }: { help: EngineHelp }) {
  const [visible, setVisible] = useState(true);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="mobile-overlay"
          variants={variants}
          initial="visible"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.5 }}
          onClick={() => setVisible(false)}
        >
          <h1>{help.touchTitle}</h1>
          {help.touch.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path d="M45.999 31.25L22.499 45.95L19.999 47.5V15L45.999 31.25ZM41.249 31.25L22.499 19.5V43L41.249 31.25Z" fill="#B3B3B3" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
