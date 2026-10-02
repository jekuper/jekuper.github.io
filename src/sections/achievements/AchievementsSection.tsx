import { motion } from 'framer-motion';
import { DotText } from '../../components/DotText';
import { onceInView, riseIn, slideIn } from '../../components/motion';
import type { AchievementsData } from '../../content/types';
import './AchievementsSection.css';

const STAGGER_S = 0.15;

export function AchievementsSection({ data }: { data: AchievementsData }) {
  return (
    <section className="achievements">
      <motion.h2 {...riseIn(0)} className="section-title">
        {data.title}
      </motion.h2>

      <div className="profiles">
        {data.profiles.map((profile, i) => (
          // Opacity only: the number is measured for its dots, so the card must not move.
          <motion.a
            key={profile.platform}
            className="profile-card"
            href={profile.href}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: i * STAGGER_S }}
            viewport={onceInView}
          >
            <span className="profile-platform">{profile.platform}</span>
            <DotText as="span" className="profile-value" text={profile.value} spacing={3} fill={6} showEmitter={false} />
            <span className="profile-value-label">{profile.valueLabel}</span>
            <span className="profile-detail">{profile.detail}</span>
          </motion.a>
        ))}
      </div>

      <h3 className="awards-title">{data.awardsTitle}</h3>
      <ul className="awards">
        {data.awards.map((award, i) => (
          <motion.li key={`${award.title}-${i}`} {...slideIn(i * STAGGER_S)}>
            <span className="award-year">{award.year}</span>
            <span className="award-title">{award.title}</span>
            <span className="award-result">{award.result}</span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
