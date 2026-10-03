import type { Ref } from 'react';
import type { Identity, Layout, NavItem, SocialLink } from '../content/types';
import { MenuOverlay } from './MenuOverlay';
import { SocialLinks } from './SocialLinks';
import './Header.css';

interface HeaderProps {
  identity: Identity;
  links: SocialLink[];
  nav: NavItem[];
  layout: Layout;
  visible: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function Header({ identity, links, nav, layout, visible, ref }: HeaderProps) {
  return (
    <div ref={ref} className={`header-holder ${visible ? 'is-visible' : 'is-hidden'}`}>
      <div className="header-left">
        <h1 className="h1-title">{identity.name}</h1>
        <h2 className="occupation-title">{identity.title}</h2>
      </div>
      {layout === 'desktop' ? (
        <div className="header-right">
          <SocialLinks links={links} />
        </div>
      ) : (
        <MenuOverlay identity={identity} links={links} nav={nav} />
      )}
    </div>
  );
}
