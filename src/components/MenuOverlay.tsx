import { useState } from 'react';
import type { Identity, SocialLink } from '../content/types';
import { asset } from '../lib/asset';
import { SocialLinks } from './SocialLinks';

export function MenuOverlay({ identity, links }: { identity: Identity; links: SocialLink[] }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((value) => !value);

  return (
    <div className="header-right">
      <button className="menu-button" type="button" aria-label="Menu" aria-expanded={open} onClick={toggle}>
        <svg width="28" height="10" viewBox="0 0 28 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line y1="0.5" x2="28" y2="0.5" stroke="#737373" />
          <line y1="9.5" x2="14" y2="9.5" stroke="#737373" />
        </svg>
      </button>
      <div className={`hamburger-overlay ${open ? 'on' : 'off'}`}>
        <img className="hamburger-close" src={asset('images/ui/close.png')} alt="Close" onClick={toggle} />
        <p className="hamburger-address">
          {identity.location.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </p>
        <SocialLinks links={links} />
      </div>
    </div>
  );
}
