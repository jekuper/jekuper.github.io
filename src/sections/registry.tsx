import type { ComponentType } from 'react';
import type { Layout, SectionEntry, SectionType } from '../content/types';
import { AboutSection } from './about/AboutSection';
import { AchievementsSection } from './achievements/AchievementsSection';
import { ContactSection } from './contact/ContactSection';
import { IntroSection } from './intro/IntroSection';
import { JourneySection } from './journey/JourneySection';
import { ProjectsSection } from './projects/ProjectsSection';
import { SkillsSection } from './skills/SkillsSection';

type DataOf<T extends SectionType> = Extract<SectionEntry, { type: T }>['data'];

export interface SectionProps<T extends SectionType> {
  data: DataOf<T>;
  layout: Layout;
}

const components: { [T in SectionType]: ComponentType<SectionProps<T>> } = {
  intro: IntroSection,
  skills: SkillsSection,
  about: AboutSection,
  journey: JourneySection,
  achievements: AchievementsSection,
  projects: ProjectsSection,
  contact: ContactSection,
};

export function SectionList({ entries, layout }: { entries: SectionEntry[]; layout: Layout }) {
  return entries
    .filter((entry) => !entry.layouts || entry.layouts.includes(layout))
    .map((entry, i) => {
      const Component = components[entry.type] as ComponentType<SectionProps<SectionType>>;
      return <Component key={`${entry.type}-${i}`} data={entry.data} layout={layout} />;
    });
}
