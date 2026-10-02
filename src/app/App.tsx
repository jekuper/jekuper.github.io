import { defaultProfile } from '../content/profiles';
import { useLayout } from '../hooks/useMediaQuery';
import { Hero } from '../sections/hero/Hero';
import { SectionList } from '../sections/registry';

export default function App() {
  const layout = useLayout();
  const profile = defaultProfile;
  return (
    <>
      {/* Keyed so a layout switch starts a fresh scene. */}
      <Hero key={layout} profile={profile} layout={layout}>
        <SectionList entries={profile.hero} layout={layout} />
      </Hero>
      <main className="page-sections">
        <SectionList entries={profile.sections} layout={layout} />
      </main>
    </>
  );
}
