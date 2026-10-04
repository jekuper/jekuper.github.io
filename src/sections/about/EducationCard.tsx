import { motion } from 'framer-motion';
import { useState } from 'react';
import { DotText } from '../../components/DotText';
import { onceInView } from '../../components/motion';
import type { Education } from '../../content/types';
import { useTheme } from '../../app/themeContext';
import { asset } from '../../lib/asset';


function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

/** School, degree and a GPA drawn in dots. */
export function EducationCard({ education }: { education: Education }) {
  const [logoMissing, setLogoMissing] = useState(false);
  const { tint } = useTheme();

  // Opacity only: the GPA is measured for its dots, so its box must not move.
  return (
    <motion.div
      className="education"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      viewport={onceInView}
    >
      <div className="education-school">
        {logoMissing ? (
          <span className="education-monogram">{initials(education.school)}</span>
        ) : (
          <img className="education-logo" src={asset(education.logo)} alt={education.school} onError={() => setLogoMissing(true)} />
        )}
        <div>
          {/* The logo already spells the name; keep it for screen readers only. */}
          <h3 className={logoMissing ? '' : 'visually-hidden'}>{education.school}</h3>
          <p className="education-degree">{education.degree}</p>
          <p className="education-years">{education.years}</p>
        </div>
      </div>
      <div className="education-gpa">
        <DotText as="span" className="education-gpa-value" text={education.gpa} spacing={2.5} fill={5} color={tint} showEmitter={false} />
        <span className="education-gpa-label">GPA / {education.gpaScale}</span>
      </div>
    </motion.div>
  );
}
