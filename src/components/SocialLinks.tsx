import type { SocialLink } from '../content/types';
import { track } from '../lib/analytics';
import { asset } from '../lib/asset';

const JIGGLE_STAGGER_S = 0.3;

export function SocialLinks({ links }: { links: SocialLink[] }) {
  return links.map((link, i) => (
    <a
      key={link.href}
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={link.label}
      onClick={() => track('social-link', { link: link.label })}
    >
      <div className="img-container">
        <img src={asset(link.icon)} alt="" style={{ animationDelay: `${i * JIGGLE_STAGGER_S}s` }} />
      </div>
    </a>
  ));
}
