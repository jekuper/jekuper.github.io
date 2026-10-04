import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { applyThemeCss, ThemeContext } from '../../app/themeContext';
import { DotText } from '../../components/DotText';
import { riseIn } from '../../components/motion';
import { SocialLinks } from '../../components/SocialLinks';
import type { Layout, PickerData, Profile, SocialLink } from '../../content/types';
import { rgb } from '../../engine';
import { track } from '../../lib/analytics';
import { EngineStage } from '../../react/EngineStage';
import { useEngine } from '../../react/engineContext';
import { useGalaxy } from '../../react/useGalaxy';
import './PickerPage.css';

const ROLE_COLOR = rgb(210, 210, 210);
const GALAXY_DOTS: Record<Layout, number> = { desktop: 3000, mobile: 1200 };
const TINT_S = 0.8;

interface PickerPageProps {
  data: PickerData;
  profiles: Profile[];
  links: SocialLink[];
  layout: Layout;
}

/** The site root: every profile in a list, and the page takes on the colors of the one under the pointer. */
export function PickerPage({ data, profiles, links, layout }: PickerPageProps) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(profiles[0]);

  useEffect(() => applyThemeCss(active.theme), [active]);

  return (
    <ThemeContext value={active.theme}>
      <EngineStage layout={layout} pin={root}>
        <div ref={root} className={`picker picker--${layout}`}>
          <PickerGalaxy root={root} layout={layout} active={active} first={profiles[0]} />
          <div className="picker-glow" />
          <p className="picker-kicker">Joe Sharipov</p>
          <DotText as="h1" className="picker-title" text={data.heading} spacing={3} fill={7} fitWidth showEmitter={false} />
          <motion.div {...riseIn(0.1)} className="picker-body">
            {data.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>
          <p className="picker-label">{data.listLabel}</p>
          <ul className="picker-list">
            {profiles.map((profile, i) => (
              <li key={profile.id}>
                <a
                  className={`picker-profile ${profile === active ? 'is-active' : ''}`}
                  href={`${import.meta.env.BASE_URL}${profile.id}/`}
                  onMouseEnter={() => setActive(profile)}
                  onFocus={() => setActive(profile)}
                  onClick={() => track('picker-profile', { profile: profile.id })}
                >
                  <span className="picker-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="picker-role-wrap">
                    <DotText
                      as="span"
                      className="picker-role"
                      text={profile.identity.title.toUpperCase()}
                      spacing={2.5}
                      fill={5}
                      fitWidth
                      color={profile === active ? profile.theme.accent : ROLE_COLOR}
                      showEmitter={false}
                    />
                    <span className="picker-tagline">{profile.tagline}</span>
                  </span>
                  <span className="picker-arrow">-&gt;</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="picker-links">
            <SocialLinks links={links} />
          </div>
        </div>
      </EngineStage>
    </ThemeContext>
  );
}

/** A galaxy behind the page that fades to the active profile's soft color. */
function PickerGalaxy({ root, layout, active, first }: { root: RefObject<HTMLDivElement | null>; layout: Layout; active: Profile; first: Profile }) {
  const engine = useEngine();
  // Seeded once in the first profile's color; later colors fade in rather than reseeding.
  const group = useGalaxy(root, {
    // Beside the text on wide screens, behind it on phones where there is no room.
    x: layout === 'desktop' ? 0.74 : 0.5,
    y: 0.5,
    radius: 0.42,
    count: GALAXY_DOTS[layout],
    magnitude: 1400,
    alpha: 0.45,
    color: first.theme.soft,
  });
  useEffect(() => engine?.tint(group, active.theme.soft, TINT_S), [engine, group, active]);
  return null;
}
