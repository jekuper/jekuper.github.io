import { defaultProfile } from '../content/profiles';
import { useLayout } from '../hooks/useMediaQuery';
import { Hero } from '../sections/hero/Hero';

export default function App() {
  const layout = useLayout();
  const profile = defaultProfile;
  return (
    <Hero key={layout} profile={profile} layout={layout}>
      {null}
    </Hero>
  );
}
