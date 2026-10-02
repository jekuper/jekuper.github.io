import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { DotText } from '../../components/DotText';
import { riseIn } from '../../components/motion';
import { SocialLinks } from '../../components/SocialLinks';
import type { ContactData, ContactTopic } from '../../content/types';
import './ContactSection.css';

const COPIED_MS = 1600;
const BLAST_MS = 4000;
const TOPIC_MS = 4000;
// Lets the visitor see the heading turn into the topic before the mail app opens.
const MAIL_DELAY_MS = 2200;

export function ContactSection({ data }: { data: ContactData }) {
  const [hovered, setHovered] = useState(false);
  // A temporary word that wins over the hover state, e.g. "COPIED".
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef(0);
  const mailTimer = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(flashTimer.current);
      window.clearTimeout(mailTimer.current);
    },
    [],
  );

  const show = (word: string, ms: number) => {
    window.clearTimeout(flashTimer.current);
    setFlash(word);
    flashTimer.current = window.setTimeout(() => setFlash(null), ms);
  };

  const copy = () => {
    void navigator.clipboard?.writeText(data.email).then(() => show(data.copiedLabel, COPIED_MS));
  };

  const pick = (topic: ContactTopic) => {
    show(topic.word, TOPIC_MS);
    window.clearTimeout(mailTimer.current);
    mailTimer.current = window.setTimeout(() => {
      window.location.href = `mailto:${data.email}?subject=${encodeURIComponent(topic.subject)}`;
    }, MAIL_DELAY_MS);
  };

  const heading = flash ?? (hovered ? data.email : data.heading);

  return (
    <footer className="contact">
      <DotText
        as="h2"
        className="contact-title"
        text={heading}
        spacing={3}
        fill={7}
        fitWidth
        // The debris of a hit re-forms as the email for a while.
        onDamage={() => {
          if (flash !== data.email) show(data.email, BLAST_MS);
        }}
        elementProps={{
          role: 'button',
          tabIndex: 0,
          title: data.email,
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
          onClick: copy,
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') copy();
          },
        }}
      />
      <motion.p {...riseIn(0.1)} className="contact-hint">
        {data.hint}
      </motion.p>
      <motion.div {...riseIn(0.2)} className="contact-topics">
        {data.topics.map((topic) => (
          <button key={topic.label} type="button" className="contact-topic" onClick={() => pick(topic)}>
            {topic.label}
          </button>
        ))}
      </motion.div>
      <motion.p {...riseIn(0.3)} className="contact-text">
        {data.text}
      </motion.p>
      <motion.a {...riseIn(0.4)} className="contact-email" href={`mailto:${data.email}`}>
        {data.email}
        <span className="skill-underline" />
      </motion.a>
      <div className="contact-links">
        <SocialLinks links={data.links} />
      </div>
      <p className="contact-footer">{data.footer}</p>
    </footer>
  );
}
