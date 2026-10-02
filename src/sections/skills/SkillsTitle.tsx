import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { SplitText } from '../../components/Text';
import type { SplitText as SplitTextValue } from '../../content/types';

const variants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' as const } },
  listShown: { opacity: 1, pointerEvents: 'none' as const, transition: { duration: 0.3 } },
  listHidden: { opacity: 0, pointerEvents: 'all' as const, transition: { duration: 0.3 } },
};

/** Rises in once, then fades out while a category is open. */
export function SkillsTitle({ title, categoryOpen }: { title: SplitTextValue; categoryOpen: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) void controls.start('visible');
  }, [inView, controls]);

  useEffect(() => {
    void controls.start(categoryOpen ? 'listHidden' : 'listShown');
  }, [categoryOpen, controls]);

  return (
    <motion.h1 ref={ref} className="section-title" initial="hidden" animate={controls} variants={variants}>
      <SplitText value={title} />
    </motion.h1>
  );
}
