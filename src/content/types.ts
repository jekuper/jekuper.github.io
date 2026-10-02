export type Layout = 'desktop' | 'mobile';

/** Text whose `tail` moves to its own line on narrow screens. */
export interface SplitText {
  head: string;
  tail?: string;
}

export interface Identity {
  name: string;
  title: string;
  location: string[];
}

export interface SocialLink {
  label: string;
  href: string;
  /** Path under public/. */
  icon: string;
}

export interface IntroData {
  title: string;
  /** `*word*` is highlighted, a blank line is a paragraph break. */
  body: string;
  rollLabel: string;
  rollAgainLabel: string;
  releaseLabel: string;
}

export interface SkillCategory {
  name: string;
  items: string[];
}

export interface SkillsData {
  title: SplitText;
  categories: SkillCategory[];
}

export interface AboutData {
  heading: string;
  lines: SplitText[];
  highlight: string;
  /** Words drifting behind the text, one row each. */
  traits: string[];
  /** Paragraphs next to the portrait. */
  bio: string[];
  /** Path under public/, transparent background. */
  portrait: string;
  portraitAlt: string;
  education: Education;
}

export interface Education {
  school: string;
  degree: string;
  years: string;
  gpa: string;
  gpaScale: string;
  /** Path under public/; a monogram is shown while the file is missing. */
  logo: string;
}

export interface Milestone {
  year: string;
  title: string;
  place: string;
  text: string;
}

export interface JourneyData {
  title: string;
  milestones: Milestone[];
}

export interface CodingProfile {
  platform: string;
  href: string;
  /** Headline number, drawn in dots. */
  value: string;
  valueLabel: string;
  /** Rank, title or percentile. */
  detail: string;
}

export interface Award {
  year: string;
  title: string;
  result: string;
}

export interface AchievementsData {
  title: string;
  profiles: CodingProfile[];
  awardsTitle: string;
  awards: Award[];
}

export interface Project {
  title: string;
  description: string;
  /** Longer text shown next to the project: role, stack, highlights. */
  details: string;
  /** Path under public/. */
  image: string;
  href: string;
  linkLabel: string;
  /** How the screenshot's dot grid is chained into lines; cycles when omitted. */
  sketch?: 'rows' | 'columns' | 'diagonal' | 'spiral' | 'dots';
}

export interface ProjectsData {
  title: SplitText;
  projects: Project[];
}

export interface ContactTopic {
  label: string;
  /** What the heading turns into when the topic is picked. */
  word: string;
  subject: string;
}

export interface ContactData {
  heading: string;
  /** Shown under the heading: how to play with it. */
  hint: string;
  copiedLabel: string;
  topics: ContactTopic[];
  email: string;
  links: SocialLink[];
  footer: string;
}

interface Entry<T extends string, D> {
  type: T;
  data: D;
  /** Layouts that show this section; all when omitted. */
  layouts?: Layout[];
}

export type SectionEntry =
  | Entry<'intro', IntroData>
  | Entry<'skills', SkillsData>
  | Entry<'about', AboutData>
  | Entry<'journey', JourneyData>
  | Entry<'achievements', AchievementsData>
  | Entry<'projects', ProjectsData>
  | Entry<'contact', ContactData>;

export type SectionType = SectionEntry['type'];

export interface EngineHelp {
  hint: { input: string; effect: string }[];
  touchTitle: string;
  touch: string[];
}

/** One page of the site, e.g. a role-specific portfolio. */
export interface Profile {
  id: string;
  identity: Identity;
  links: SocialLink[];
  engineHelp: EngineHelp;
  /** Sections drawn over the particle canvas. */
  hero: SectionEntry[];
  /** Sections below the canvas. */
  sections: SectionEntry[];
}
