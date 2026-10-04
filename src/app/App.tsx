import { MotionConfig } from 'framer-motion';
import { useRef } from 'react';
import { MetricsToast } from '../components/MetricsToast';
import { metrics } from '../content/identity';
import { useLayout } from '../hooks/useMediaQuery';
import { EngineStage } from '../react/EngineStage';
import { Hero } from '../sections/hero/Hero';
import { SectionList } from '../sections/registry';
import { resolveProfile } from './route';
import { applyThemeCss, ThemeContext } from './themeContext';

// Read once: switching profiles is a full page load.
const profile = resolveProfile();
applyThemeCss(profile.theme);

export default function App() {
  const layout = useLayout();
  const hero = useRef<HTMLDivElement>(null);
  return (
    <ThemeContext value={profile.theme}>
    <MotionConfig reducedMotion="user">
      <EngineStage layout={layout} pin={hero}>
        {/* Keyed so a layout switch starts a fresh scene. */}
        <Hero key={layout} ref={hero} profile={profile} layout={layout}>
          <SectionList entries={profile.hero} layout={layout} />
        </Hero>
        <main className="page-sections">
          <SectionList entries={profile.sections} layout={layout} />
        </main>
      </EngineStage>
      <MetricsToast data={metrics} />
    </MotionConfig>
    </ThemeContext>
  );
}
