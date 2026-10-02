import { useRef } from 'react';
import { defaultProfile } from '../content/profiles';
import { useLayout } from '../hooks/useMediaQuery';
import { EngineStage } from '../react/EngineStage';
import { Hero } from '../sections/hero/Hero';
import { SectionList } from '../sections/registry';

export default function App() {
  const layout = useLayout();
  const profile = defaultProfile;
  const hero = useRef<HTMLDivElement>(null);
  return (
    <EngineStage layout={layout} pin={hero}>
      {/* Keyed so a layout switch starts a fresh scene. */}
      <Hero key={layout} ref={hero} profile={profile} layout={layout}>
        <SectionList entries={profile.hero} layout={layout} />
      </Hero>
      <main className="page-sections">
        <SectionList entries={profile.sections} layout={layout} />
      </main>
    </EngineStage>
  );
}
