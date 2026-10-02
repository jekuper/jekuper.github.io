const viewport = { once: true } as const;
const ease = 'easeInOut' as const;

/** Wipes in from the left; `shift` also slides it 50px. */
export function wipeIn(delay: number, shift = true) {
  return {
    initial: { ...(shift && { x: -50 }), clipPath: 'inset(0% 100% 0% 0%)' },
    whileInView: { ...(shift && { x: 0 }), clipPath: 'inset(0% 0% 0% 0%)' },
    transition: { duration: 0.5, ease, delay },
    viewport,
  };
}

export function riseIn(delay: number) {
  return {
    initial: { y: 50, opacity: 0, scale: 1 },
    whileInView: { y: 0, opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease, delay },
    viewport,
  };
}

export function dropIn(delay: number) {
  return {
    initial: { y: -50, opacity: 0 },
    whileInView: { y: 0, opacity: 1 },
    transition: { duration: 0.5, ease, delay },
    viewport,
  };
}

export function slideIn(delay: number) {
  return {
    initial: { x: -50, opacity: 0 },
    whileInView: { x: 0, opacity: 1 },
    transition: { duration: 0.5, ease, delay },
    viewport,
  };
}

export { viewport as onceInView };
