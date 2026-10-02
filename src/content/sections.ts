import type { AboutData, IntroData, ProjectsData, SkillsData, StatsData } from './types';

export const intro: IntroData = {
  title: 'Did you Know?',
  body:
    'Website is a self-written game engine. It has *physics*, *destruction system* and *cool animations*.\n\n' +
    '*Try clicking* on one of the skills below.',
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
};

export const stats: StatsData = {
  stats: [
    { value: '6', label: 'Games' },
    { value: '15', label: 'Projects' },
    { value: '4', label: 'Years of Exp.' },
    { value: '2%', label: 'Top Leetcode' },
  ],
};

export const projects: ProjectsData = {
  title: { head: 'Have a sneak look on', tail: 'some projects' },
  projects: [
    {
      title: 'Graph IO',
      description: 'A complex mobile puzzle game, with over 50 levels.',
      image: 'images/projects/graphio.webp',
      href: 'https://jekuper.itch.io/graph-io',
    },
    {
      title: 'Ronikara',
      description: 'First Person Multiplayer Game with unique techniques.',
      image: 'images/projects/ronikara.webp',
      href: 'https://jekuper.itch.io/ronikara',
    },
    {
      title: 'Meta Cube',
      description: 'A fun little game about mutations.',
      image: 'images/projects/metacube.webp',
      href: 'https://jekuper.itch.io/metacube',
    },
    {
      title: 'Demo 1',
      description: 'A tech demo of 3D procedural dungeon generation.',
      image: 'images/projects/demo.webp',
      href: 'https://github.com/jekuper/proceduralDungeon3DGame',
    },
    {
      title: 'Giga Wolf',
      description: 'A casual PC game with simple animal simulation.',
      image: 'images/projects/gigawolf.webp',
      href: 'https://jekuper.itch.io/wolf-simulator',
    },
    {
      title: 'Emotional Maze',
      description: 'A puzzle game with procedural maze.',
      image: 'images/projects/maze.webp',
      href: 'https://jekuper.itch.io/emotional-maze',
    },
    {
      title: 'Card Trainer',
      description: 'A flashcard based language learning app.',
      image: 'images/projects/cardtrainer.webp',
      href: 'https://jekuper.itch.io/cardtrainer',
    },
  ],
};
