import { links } from './identity';
import type { AboutData, AchievementsData, ContactData, IntroData, JourneyData, ProjectsData, SkillsData } from './types';

export const intro: IntroData = {
  title: 'Did you Know?',
  body:
    'Website is a self-written game engine. It has *physics*, *destruction system* and *cool animations*.\n\n' +
    '*Roll a figure* and watch the dots draw it.',
  rollLabel: 'Roll a figure',
  rollAgainLabel: 'Roll another',
  releaseLabel: 'Let it go',
};

export const skills: SkillsData = {
  title: { head: 'Skillset', tail: 'for your needs' },
  categories: [
    { name: 'Technologies', items: ['Git/GitHub', 'Docker', 'Figma', 'Azure', 'AWS/Cloud Services'] },
    { name: 'Front End', items: ['React.js', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Tailwind CSS', 'Three.js'] },
    {
      name: 'Back End',
      items: ['Node.js', 'Python', 'PHP', 'Flask', 'Django', 'C#', '.NET', 'REST APIs', 'Kubernetes'],
    },
    { name: 'Other', items: ['Linux', 'UI/UX', 'CI/CD', 'Agile/Scrum', 'Selenium', 'AI/LLMs'] },
  ],
};

export const about: AboutData = {
  heading: 'About Me',
  lines: [{ head: 'Craft solutions' }, { head: 'Refine Ideas' }, { head: 'To', tail: 'Make' }],
  highlight: 'Great Work',
  traits: ['Adaptable', 'Curious', 'Collaborative', 'Curious', 'Collaborative', 'Adaptable'],
  bio: [
    '[Placeholder: two or three sentences on who you are and what you build]',
    '[Placeholder: one sentence on what you are into outside of work]',
  ],
  portrait: 'images/about/portrait.webp',
  portraitAlt: 'Joe Sharipov',
  education: {
    school: 'Pace University',
    degree: 'B.S. in Computer Science, Minor in Mathematics',
    years: '2024 - 2027',
    gpa: '3.89',
    gpaScale: '4.0',
    logo: 'images/about/pace-logo.webp',
  },
};

const milestone = (hint: string) => ({
  year: '[Year]',
  title: `[Placeholder: ${hint}]`,
  place: '[Placeholder: school, studio or company]',
  text: '[Placeholder: one line on what you did or learned]',
});

export const journey: JourneyData = {
  title: 'Journey',
  milestones: [
    milestone('how it started'),
    milestone('first game you shipped'),
    milestone('studies'),
    milestone('first job or contract'),
    milestone('current role'),
  ],
};

export const achievements: AchievementsData = {
  title: 'Achievements',
  profiles: [
    {
      platform: 'LeetCode',
      href: 'https://leetcode.com/u/[handle]',
      value: '[Rating]',
      valueLabel: 'contest rating',
      detail: 'Top 2%',
    },
    {
      platform: 'Codeforces',
      href: 'https://codeforces.com/profile/[handle]',
      value: '[Rating]',
      valueLabel: 'max rating',
      detail: '[Placeholder: rank, e.g. Expert]',
    },
    {
      platform: '[Placeholder: CTFtime, HackerRank...]',
      href: '[Placeholder: profile link]',
      value: '[Value]',
      valueLabel: '[Placeholder: what the number is]',
      detail: '[Placeholder: rank or team]',
    },
  ],
  awardsTitle: 'Awards',
  awards: [
    { year: '[Year]', title: '[Placeholder: CTF or contest name]', result: '[Placeholder: placement]' },
    { year: '[Year]', title: '[Placeholder: hackathon or olympiad]', result: '[Placeholder: placement]' },
    { year: '[Year]', title: '[Placeholder: another award]', result: '[Placeholder: placement]' },
  ],
};

export const projects: ProjectsData = {
  title: { head: 'Have a sneak look on', tail: 'some projects' },
  projects: [
    {
      title: 'Graph IO',
      description: 'A complex mobile puzzle game, with over 50 levels.',
      details: '[Placeholder: your role, the tech stack and one highlight]',
      image: 'images/projects/graphio.webp',
      href: 'https://jekuper.itch.io/graph-io',
      linkLabel: 'Play on itch.io',
    },
    {
      title: 'Ronikara',
      description: 'First Person Multiplayer Game with unique techniques.',
      details: '[Placeholder: your role, the tech stack and one highlight]',
      image: 'images/projects/ronikara.webp',
      href: 'https://jekuper.itch.io/ronikara',
      linkLabel: 'Play on itch.io',
    },
    {
      title: 'Meta Cube',
      description: 'A fun little game about mutations.',
      details: '[Placeholder: your role, the tech stack and one highlight]',
      image: 'images/projects/metacube.webp',
      href: 'https://jekuper.itch.io/metacube',
      linkLabel: 'Play on itch.io',
    },
    {
      title: 'Demo 1',
      description: 'A tech demo of 3D procedural dungeon generation.',
      details: '[Placeholder: your role, the tech stack and one highlight]',
      image: 'images/projects/demo.webp',
      href: 'https://github.com/jekuper/proceduralDungeon3DGame',
      linkLabel: 'View source',
    },
    {
      title: 'Giga Wolf',
      description: 'A casual PC game with simple animal simulation.',
      details: '[Placeholder: your role, the tech stack and one highlight]',
      image: 'images/projects/gigawolf.webp',
      href: 'https://jekuper.itch.io/wolf-simulator',
      linkLabel: 'Play on itch.io',
    },
    {
      title: 'Emotional Maze',
      description: 'A puzzle game with procedural maze.',
      details: '[Placeholder: your role, the tech stack and one highlight]',
      image: 'images/projects/maze.webp',
      href: 'https://jekuper.itch.io/emotional-maze',
      linkLabel: 'Play on itch.io',
    },
    {
      title: 'Card Trainer',
      description: 'A flashcard based language learning app.',
      details: '[Placeholder: your role, the tech stack and one highlight]',
      image: 'images/projects/cardtrainer.webp',
      href: 'https://jekuper.itch.io/cardtrainer',
      linkLabel: 'Play on itch.io',
    },
  ],
};

export const contact: ContactData = {
  heading: "LET'S TALK",
  hint: 'Hover to see my email, click to copy it. Or throw a bomb at it.',
  copiedLabel: 'COPIED',
  topics: [
    { label: 'Hiring', word: 'HIRING?', subject: 'Hiring' },
    { label: 'Collaborate', word: "LET'S BUILD", subject: 'Collaboration' },
    { label: 'Game jam?', word: 'GAME JAM?', subject: 'Game jam' },
    { label: 'Just saying hi', word: 'HI!', subject: 'Hello' },
  ],
  text: '[Placeholder: one or two lines on what kind of work or roles you are looking for]',
  email: 'joesharipov@gmail.com',
  links,
  footer: 'Joe Sharipov',
};
