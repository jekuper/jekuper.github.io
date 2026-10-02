import { motion } from 'framer-motion';
import { riseIn, wipeIn } from '../../components/motion';
import { RichText } from '../../components/Text';
import type { IntroData } from '../../content/types';
import './IntroSection.css';

export function IntroSection({ data }: { data: IntroData }) {
  return (
    <div className="section">
      <motion.h1 {...riseIn(0.5)} className="section-title">
        {data.title}
      </motion.h1>
      <div className="section-left" />
      <div className="section-right">
        <motion.p {...wipeIn(0.5)}>
          <RichText source={data.body} />
        </motion.p>
      </div>
    </div>
  );
}
