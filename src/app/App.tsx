import { MotionConfig } from 'framer-motion';
import { useRef } from 'react';
import { MetricsToast } from '../components/MetricsToast';
import { links, metrics } from '../content/identity';
import { picker } from '../content/picker';
import { profiles } from '../content/profiles';
import type { Layout, Profile } from '../content/types';
import { useLayout } from '../hooks/useMediaQuery';
import { EngineStage } from '../react/EngineStage';
import { Hero } from '../sections/hero/Hero';
import { PickerPage } from '../sections/picker/PickerPage';
import { SectionList } from '../sections/registry';
import { resolveProfile } from './route';
import { applyThemeCss, ThemeContext } from './themeContext';

// Read once: switching profiles is a full page load. Null is the picker at the site root.
const profile = resolveProfile();
if (profile) applyThemeCss(profile.theme);

export default function App() {
  const layout = useLayout();
  return (
    <MotionConfig reducedMotion="user">
      {profile ? (
        <ProfilePage profile={profile} layout={layout} />
      ) : (
        <PickerPage data={picker} profiles={Object.values(profiles)} links={links} layout={layout} />
      )}
      <MetricsToast data={metrics} />
    </MotionConfig>
  );
}

function ProfilePage({ profile, layout }: { profile: Profile; layout: Layout }) {
  const hero = useRef<HTMLDivElement>(null);
  return (
    <ThemeContext value={profile.theme}>
      <EngineStage layout={layout} pin={hero}>
        {/* Keyed so a layout switch starts a fresh scene. */}
        <Hero key={layout} ref={hero} profile={profile} layout={layout}>
          <SectionList entries={profile.hero} layout={layout} />
        </Hero>
        <main className="page-sections">
          <SectionList entries={profile.sections} layout={layout} />
        </main>
      </EngineStage>
    </ThemeContext>
  );
}
