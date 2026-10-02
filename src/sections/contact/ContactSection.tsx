import { motion } from 'framer-motion';
import { DotText } from '../../components/DotText';
import { riseIn } from '../../components/motion';
import { SocialLinks } from '../../components/SocialLinks';
import type { ContactData } from '../../content/types';
import './ContactSection.css';

export function ContactSection({ data }: { data: ContactData }) {
  return (
    <footer className="contact">
      <DotText as="h2" className="contact-title" text={data.heading} spacing={3} fill={7} />
      <motion.p {...riseIn(0.2)} className="contact-text">
        {data.text}
      </motion.p>
      <motion.a {...riseIn(0.35)} className="contact-email" href={`mailto:${data.email}`}>
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
