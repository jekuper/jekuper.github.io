import { links } from './identity';
import type { AboutData, AchievementsData, ContactData, IntroData, JourneyData, ProjectsData, SkillsData } from './types';

export const intro: IntroData = {
  title: 'Did you Know?',
  body:
    'Website is a self-written game engine. It has *physics*, *destruction system* and *cool animations*.\n\n' +
    '*Roll a figure* and watch the dots draw it.',
  touchBody:
    'Website is a self-written game engine. It has *physics*, *destruction system* and *cool animations*. ' +
    'Open it on a computer to play with them.\n\n' +
    '*Roll a figure* and watch the dots draw it.',
  rollLabel: 'Roll a figure',
  rollAgainLabel: 'Roll another',
  releaseLabel: 'Let it go',
};

export const skills: SkillsData = {
  title: { head: 'Skillset', tail: 'for your needs' },
  categories: [
    {
      name: 'Engine & Graphics',
      items: ['Unity', 'C#', 'URP', 'Shaders (HLSL/GLSL)', 'Shader Graph', 'Rendering', 'VFX/Particles', 'Animation', 'Physics', 'Blender'],
    },
    {
      name: 'Gameplay',
      items: [
        'Gameplay Programming',
        'Game AI/Pathfinding',
        'Procedural Generation',
        'Prototyping',
        'Game Design',
        'Editor Tools',
        'Profiling/Optimization',
        'Design Patterns/SOLID',
        'Game Telemetry',
      ],
    },
    {
      name: 'Multiplayer & Platforms',
      items: [
        'Multiplayer/Netcode',
        'FishNet',
        'Mirror',
        'Photon',
        'Mobile (iOS/Android)',
        'WebGL',
        'Cross-platform',
        'Addressables',
        'VR',
      ],
    },
    {
      name: 'Tools',
      items: ['C++', 'Python', 'TypeScript', 'Git', 'CI/CD', 'AWS', 'Docker', 'Linux', 'Multithreading', 'Jira'],
    },
  ],
};

export const about: AboutData = {
  heading: 'About Me',
  lines: [{ head: 'Craft solutions' }, { head: 'Refine Ideas' }, { head: 'To', tail: 'Make' }],
  highlight: 'Great Work',
  traits: ['Adaptable', 'Curious', 'Collaborative', 'Curious', 'Collaborative', 'Adaptable'],
  bio: [
    'I am a game developer in New York and a founding Unity developer at Wagr, a skill-gaming startup, ' +
      'where I build multiplayer games end to end: gameplay, netcode, dedicated servers and the SDKs every game runs on. ' +
      'Before that I shipped my own games to itch.io and Google Play, from an online FPS to a puzzle game with its own level solver.',
    'Outside of games I run the Pace University Cybersecurity Club and take software apart for fun with reverse engineering and CTFs.',
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

export const journey: JourneyData = {
  title: 'Journey',
  milestones: [
    {
      year: '2022',
      title: 'First shipped games',
      place: 'Indie, itch.io',
      text: 'Released Emotional Maze for Android and the web, and Ronikara, an online FPS for Windows.',
    },
    {
      year: '2023',
      title: 'Procedural 3D dungeons',
      place: 'Personal project',
      text: 'Built a multi-floor dungeon generator with Delaunay, spanning trees and A* corridors.',
    },
    {
      year: '2024',
      title: 'Unity Developer',
      place: 'TheNetVR',
      text: 'Fixed netcode on a VR streaming app, added host migration and an in-game Twitch chat.',
    },
    {
      year: '2025',
      title: 'Founding Unity Developer',
      place: 'Wagr',
      text: 'Joined from day one and designed the server-authoritative setup all our games run on.',
    },
    {
      year: '2026',
      title: 'Multiplayer at scale',
      place: 'Wagr',
      text: 'Shipping 1v1 and score games to iOS and the web, with prediction, reconnects and dedicated servers.',
    },
  ],
};

export const achievements: AchievementsData = {
  title: 'Achievements',
  profiles: [
    {
      platform: 'LeetCode',
      href: 'https://leetcode.com/u/jekuper/',
      value: '2028',
      valueLabel: 'contest rating',
      detail: 'Top 2%',
    },
    {
      platform: 'Codeforces',
      href: 'https://codeforces.com/profile/whynot32',
      value: '1776',
      valueLabel: 'max rating',
      detail: 'Expert',
    },
    {
      platform: 'NSA Codebreaker',
      href: 'certificates/nsa-codebreaker-2024.pdf',
      value: '7/7',
      valueLabel: 'tasks solved',
      detail: 'One of 30 full solvers in the US',
    },
    {
      platform: 'National Cyber League',
      href: 'certificates/ncl-spring-2025.pdf',
      value: '#140',
      valueLabel: 'of 8,573 players',
      detail: 'Top 2%',
    },
  ],
  awardsTitle: 'Awards',
  awards: [
    {
      year: '2024',
      title: 'NSA Codebreaker Challenge',
      result: 'All 7 tasks, only Pace solver',
      certificate: 'certificates/nsa-codebreaker-2024.pdf',
    },
    {
      year: '2025',
      title: 'National Cyber League, Spring',
      result: '#140 of 8,573',
      certificate: 'certificates/ncl-spring-2025.pdf',
    },
    {
      year: '2025 - 2026',
      title: 'NECCDC, Pace University team',
      result: 'Advanced to regionals',
      certificate: 'certificates/neccdc-2026.pdf',
    },
    { year: '2024 - 2026', title: "Dean's List, Pace University", result: 'Every semester' },
  ],
};

export const projects: ProjectsData = {
  title: { head: 'Have a sneak look on', tail: 'some projects' },
  projects: [
    {
      title: 'Graph IO',
      year: '2025',
      description: 'A complex mobile puzzle game, with 45 levels.',
      details:
        'Solo project in Unity 6 and C#, released on Google Play as SYNC. Every level is checked by a C++ solver I wrote, which proves it can be solved and finds the fewest moves, and a parallel Python generator builds new levels around it.',
      image: 'images/projects/graphio.webp',
      links: [
        { href: 'https://jekuper.itch.io/graph-io', label: 'Play on itch.io' },
        { href: 'https://play.google.com/store/apps/details?id=com.Outlexity.SYNC', label: 'Google Play' },
      ],
    },
    {
      title: 'Ronikara',
      year: '2022',
      description: 'First Person Multiplayer Game with unique techniques.',
      details:
        'Solo project in Unity and C#. You cast spells by typing mouse-button sequences, and elemental effects like wet, burning and shocked cancel each other out. I moved the netcode from Mirror to Photon for online rooms of up to 10 players and shipped it as a Windows installer.',
      image: 'images/projects/ronikara.webp',
      links: [{ href: 'https://jekuper.itch.io/ronikara', label: 'Play on itch.io' }],
    },
    {
      title: 'Meta Cube',
      year: '2024',
      description: 'A fun little game about mutations.',
      details:
        'Solo, built in under 68 hours in Unity. Every stat of your cube comes from four DNA genes across 13 abilities, and each mutation unlocks a new ability but rerolls a third of your build. Six enemy types and an online leaderboard.',
      image: 'images/projects/metacube.webp',
      links: [{ href: 'https://jekuper.itch.io/metacube', label: 'Play on itch.io' }],
    },
    {
      title: 'Demo 1',
      year: '2023',
      description: 'A tech demo of 3D procedural dungeon generation.',
      details:
        'Solo, Unity and C#. Builds a multi-floor dungeon on a 3D voxel grid with Delaunay tetrahedralization, a spanning tree with some loops added back, and A* for corridors of any width. A greedy pass merges per-cell walls into a few large boxes.',
      image: 'images/projects/demo.webp',
      links: [{ href: 'https://github.com/jekuper/proceduralDungeon3DGame', label: 'View source' }],
    },
    {
      title: 'Giga Wolf',
      year: '2022',
      description: 'A casual PC game with simple animal simulation.',
      details:
        'Solo, Unity and C#, built in about a week. Each animal runs on AI modules for movement, obstacles, following, fear and attack, mixed per species in an ECS-style setup. Play as a wolf hunting sheep and avoiding bulls, or as a dog guarding the herd from a wolf pack.',
      image: 'images/projects/gigawolf.webp',
      links: [{ href: 'https://jekuper.itch.io/wolf-simulator', label: 'Play on itch.io' }],
    },
    {
      title: 'Emotional Maze',
      year: '2022',
      description: 'A puzzle game with procedural maze.',
      details:
        'Solo, Unity and C#, released for Android and the web. A tether ties you to the center: stars lengthen it, and your light is both your vision and your health. A modified Dijkstra places every star and camp in order of how far you can reach.',
      image: 'images/projects/maze.webp',
      links: [{ href: 'https://jekuper.itch.io/emotional-maze', label: 'Play on itch.io' }],
    },
    {
      title: 'Card Trainer',
      year: '2021',
      description: 'A flashcard based language learning app.',
      details:
        'One of my first games, made in Unity for Android. Flashcards for learning languages: it counts how often you get each card right and wrong, builds the queue for your next practice session from that, and sends reminders to come back.',
      image: 'images/projects/cardtrainer.webp',
      links: [{ href: 'https://jekuper.itch.io/cardtrainer', label: 'Play on itch.io' }],
    },
  ],
};

export const contact: ContactData = {
  heading: "LET'S TALK",
  hint: 'Hover to see my email, click to copy it.',
  touchHint: 'Tap to copy my email.',
  copiedLabel: 'COPIED',
  topics: [
    { label: 'Hiring', word: 'HIRING?', icon: 'briefcase', subject: 'Hiring' },
    { label: 'Collaborate', word: "LET'S BUILD", icon: 'blocks', subject: 'Collaboration' },
    { label: 'Game jam?', word: 'GAME JAM?', icon: 'gamepad', subject: 'Game jam' },
    { label: 'Just saying hi', word: 'HI!', icon: 'smile', subject: 'Hello' },
  ],
  email: 'joesharipov@gmail.com',
  links,
  footer: 'Joe Sharipov',
};
