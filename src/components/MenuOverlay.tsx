import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Identity, NavItem, SectionType, SocialLink } from '../content/types';
import { rgb } from '../engine';
import { sectionAnchor } from '../lib/anchors';
import { useEngine } from '../react/engineContext';
import { DotText } from './DotText';
import { SocialLinks } from './SocialLinks';

const MENU_CLIP = 'menu';
// Lets the picked name visibly blow apart before the page scrolls away from it.
const SCROLL_DELAY_MS = 350;
const ITEM_COLOR = rgb(236, 232, 248);

// Icon dots in a 28 by 28 box: two bars when closed, a cross when open.
const ICON_DOTS = 12;
const bars = Array.from({ length: ICON_DOTS }, (_, k) => (k < 8 ? [2 + (k * 24) / 7, 9] : [2 + (k - 8) * 4, 19]));
const cross = Array.from({ length: ICON_DOTS }, (_, k) => {
  const t = (k % 6) / 5;
  return k < 6 ? [5 + t * 18, 5 + t * 18] : [23 - t * 18, 5 + t * 18];
});

interface MenuOverlayProps {
  identity: Identity;
  links: SocialLink[];
  nav: NavItem[];
}

/**
 * Full-screen menu: a purple disc grows from the button under the canvas, the
 * rest of the page fades out and the section names are drawn in dots that
 * stream out of the button. Picking one blows it apart and scrolls there.
 */
export function MenuOverlay({ identity, links, nav }: MenuOverlayProps) {
  const engine = useEngine();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<SectionType | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pendingScroll = useRef<SectionType | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (open) {
      const r = button.current?.getBoundingClientRect();
      if (r) {
        root.style.setProperty('--menu-x', `${r.left + r.width / 2}px`);
        root.style.setProperty('--menu-y', `${r.top + r.height / 2}px`);
      }
      if (engine) {
        const corner = engine.viewToWorld(0, 0);
        engine.defineClip(MENU_CLIP, { x: corner.x, y: corner.y, ...engine.size });
      }
    }
    root.classList.toggle('menu-open', open);
    engine?.focus(open ? MENU_CLIP : null);
    const target = pendingScroll.current;
    if (open || !target) return;
    pendingScroll.current = null;
    const timer = window.setTimeout(
      () => document.getElementById(sectionAnchor(target))?.scrollIntoView({ behavior: 'smooth' }),
      SCROLL_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open, engine]);

  useEffect(
    () => () => {
      document.documentElement.classList.remove('menu-open');
      engine?.focus(null);
    },
    [engine],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = () => {
    setChosen(null);
    setOpen((value) => !value);
  };

  const go = (target: SectionType) => {
    setChosen(target);
    pendingScroll.current = target;
    setOpen(false);
  };

  const fromButton = () => {
    const r = button.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
  };

  const icon = open ? cross : bars;

  return (
    <div className="header-right">
      <button
        ref={button}
        className={`menu-button ${open ? 'is-open' : ''}`}
        type="button"
        aria-label={open ? 'Close menu' : 'Menu'}
        aria-expanded={open}
        onClick={toggle}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          {icon.map(([x, y], k) => (
            <circle key={k} r="1.4" style={{ transform: `translate(${x}px, ${y}px)`, transitionDelay: `${k * 18}ms` }} />
          ))}
        </svg>
      </button>
      {createPortal(<div className={`menu-panel ${open ? 'on' : ''}`} />, document.body)}
      {createPortal(
        <nav className={`menu-layer ${open ? 'on' : ''}`} aria-hidden={!open}>
          <ul className="menu-list">
            {nav.map((item) => (
              <li key={item.target}>
                <DotText
                  as="button"
                  className="menu-item"
                  text={item.label}
                  spacing={2.5}
                  color={ITEM_COLOR}
                  active={open}
                  quick
                  hide={chosen === item.target ? 'scatter' : 'recall'}
                  clip={MENU_CLIP}
                  emitter={fromButton}
                  showEmitter={false}
                  elementProps={{ tabIndex: open ? 0 : -1, onClick: () => go(item.target) }}
                />
              </li>
            ))}
          </ul>
          <div className="menu-footer">
            <p className="menu-address">
              {identity.location.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
            <div className="menu-socials">
              <SocialLinks links={links} />
            </div>
          </div>
        </nav>,
        document.body,
      )}
    </div>
  );
}
