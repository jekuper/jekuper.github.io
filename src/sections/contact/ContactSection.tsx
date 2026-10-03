import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { DOT_ICONS } from '../../components/dotIcons';
import { DotText } from '../../components/DotText';
import { riseIn } from '../../components/motion';
import { SocialLinks } from '../../components/SocialLinks';
import type { ContactData, ContactTopic } from '../../content/types';
import { useFinePointer } from '../../hooks/useMediaQuery';
import { track } from '../../lib/analytics';
import './ContactSection.css';

const TOPIC_MS = 4000;
// The topic's drawing and word, then the dots fold into an envelope, then the mail app opens.
const FOLD_MS = 1200;
const MAIL_DELAY_MS = 2200;

interface Flash {
  text: string;
  icon?: string;
}

export function ContactSection({ data }: { data: ContactData }) {
  const finePointer = useFinePointer();
  const [hovered, setHovered] = useState(false);
  // Stays until the pointer leaves, so the confirmation does not flicker back to the email.
  const [copied, setCopied] = useState(false);
  // A temporary shape that wins over the hover state, e.g. a picked topic.
  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimer = useRef(0);
  const foldTimer = useRef(0);
  const mailTimer = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(flashTimer.current);
      window.clearTimeout(foldTimer.current);
      window.clearTimeout(mailTimer.current);
    },
    [],
  );

  const show = (shape: Flash, ms: number) => {
    window.clearTimeout(flashTimer.current);
    setFlash(shape);
    flashTimer.current = window.setTimeout(() => setFlash(null), ms);
  };

  const copy = () => {
    track('email-copy');
    void navigator.clipboard?.writeText(data.email).then(() => setCopied(true));
  };

  const pick = (topic: ContactTopic) => {
    track('contact-topic', { topic: topic.subject });
    show({ text: topic.word, icon: DOT_ICONS[topic.icon] }, TOPIC_MS);
    window.clearTimeout(foldTimer.current);
    foldTimer.current = window.setTimeout(() => setFlash({ text: '', icon: DOT_ICONS.envelope }), FOLD_MS);
    window.clearTimeout(mailTimer.current);
    mailTimer.current = window.setTimeout(() => {
      window.location.href = `mailto:${data.email}?subject=${encodeURIComponent(topic.subject)}`;
    }, MAIL_DELAY_MS);
  };

  const hoverWord = copied ? data.copiedLabel : data.email;
  const heading = flash ?? { text: hovered ? hoverWord : data.heading };

  return (
    <footer className="contact">
      <DotText
        as="h2"
        className="contact-title"
        text={heading.text}
        icon={heading.icon}
        spacing={3}
        fill={8}
        fitWidth
        showEmitter={false}
        elementProps={{
          role: 'button',
          tabIndex: 0,
          title: data.email,
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => {
            setHovered(false);
            setCopied(false);
          },
          onClick: copy,
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') copy();
          },
        }}
      />
      <motion.p {...riseIn(0.1)} className="contact-hint">
        {finePointer ? data.hint : data.touchHint}
      </motion.p>
      <motion.div {...riseIn(0.2)} className="contact-topics">
        {data.topics.map((topic) => (
          <button key={topic.label} type="button" className="contact-topic" onClick={() => pick(topic)}>
            {topic.label}
          </button>
        ))}
      </motion.div>
      <div className="contact-links">
        <SocialLinks links={data.links} />
      </div>
      <p className="contact-footer">{data.footer}</p>
    </footer>
  );
}
