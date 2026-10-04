import { links } from './identity';
import { about } from './sections';
import type { AboutData, ContactData, JourneyData, ProjectsData, SkillsData } from './types';

// Content of the backend profile; shared sections (intro, achievements) come from sections.ts.

const wcdaht = (tool: string) => `https://wcdaht.github.io/reader.html?file=content/${tool}/README.md`;

export const backendSkills: SkillsData = {
  title: { head: 'Skillset', tail: 'for your needs' },
  categories: [
    { name: 'Languages', items: ['Rust', 'Python', 'C#', 'Go', 'C++', 'TypeScript', 'SQL', 'Bash'] },
    {
      name: 'Backend',
      items: ['REST APIs', 'FastAPI', 'Flask', 'WebSockets', 'Concurrency', 'Data Pipelines', 'Distributed Systems', 'SDK Design'],
    },
    {
      name: 'Cloud & DevOps',
      items: ['AWS (EC2, S3, CloudFront)', 'Docker/Podman', 'GitHub Actions', 'CI/CD', 'Ansible', 'Linux', 'EdgeGap', 'Self-hosted Runners'],
    },
    {
      name: 'Data & Ops',
      items: ['PostgreSQL', 'SQLite', 'MongoDB', 'MySQL', 'SQLAlchemy', 'Sentry', 'Grafana', 'Git'],
    },
  ],
};

export const backendAbout: AboutData = {
  ...about,
  bio: [
    'I build backends and the infrastructure under them. At Wagr I designed how our multiplayer matches run: ' +
      'a Rust backend starts an authoritative headless server for each match, first on AWS EC2 and now on EdgeGap, ' +
      'and my CI/CD ships every game to the web, iOS and those servers.',
    'This summer at the Westchester County District Attorney\'s Office I rewrote forensic tools in Rust and ran the team\'s ' +
      'self-hosted dev infrastructure. Outside of work I run the Pace University Cybersecurity Club.',
  ],
};

export const backendJourney: JourneyData = {
  title: 'Journey',
  milestones: [
    {
      year: '2023',
      title: 'First backend',
      place: 'Personal project',
      text: 'A multiplayer Telegram game on MySQL and SQLAlchemy, with throttling and a connection pool.',
    },
    {
      year: '2024',
      title: 'Unity Developer',
      place: 'TheNetVR',
      text: 'Kept multiplayer lobbies alive with host migration over Unity Gaming Services.',
    },
    {
      year: '2025',
      title: 'Founding Unity Developer',
      place: 'Wagr',
      text: 'Designed the per-match server setup: headless servers on AWS EC2, later EdgeGap.',
    },
    {
      year: '2025 - 2026',
      title: 'Lab infrastructure',
      place: 'Pace University Cybersecurity Club',
      text: 'Built a 13-VM blue-team training lab, then an infrastructure-as-code tryouts lab.',
    },
    {
      year: '2026',
      title: 'Software Engineer Intern',
      place: "Westchester County District Attorney's Office",
      text: 'Ported forensic tools to Rust and ran self-hosted Forgejo, CI runners and release pipelines.',
    },
  ],
};

export const backendProjects: ProjectsData = {
  title: { head: 'Have a sneak look on', tail: 'some projects' },
  projects: [
    {
      title: 'Wagr Match Servers',
      year: '2025',
      description: 'Per-match game servers for a real-money skill-gaming platform.',
      details:
        'I designed the server-authoritative setup: a Rust backend starts a headless Unity server for each match, first on AWS EC2 with autoscaling, now on EdgeGap with logs piped to AWS and results reported back by match ID. I also wrote the CI/CD that builds and ships to TestFlight, WebGL and EdgeGap, and wired Sentry into clients and servers.',
      image: 'images/projects/wagr.webp',
      links: [{ href: 'https://wagr.co/', label: 'Visit wagr.co' }],
    },
    {
      title: 'Release Portal',
      year: '2026',
      description: "Public downloads for the DA office's private forensic tools.",
      details:
        'Releasing a private tool repo updates a public GitHub Pages site: a GitHub App mints a token and dispatches the site workflow, which pulls the binaries and READMEs and merges them into a manifest with jq. The builds run on self-hosted Windows and Linux runners I set up.',
      image: 'images/projects/release-portal.webp',
      links: [{ href: 'https://wcdaht.github.io/index.html', label: 'Visit the site' }],
    },
    {
      title: 'AutoApplyBot',
      year: '2026',
      description: 'A daily job-board scraper with matching and Telegram alerts.',
      details:
        'Python over 20 job boards and ATS APIs: about 290 companies and 46,000+ postings in SQLite. Each job moves through an idempotent state machine, so a crashed run resumes without duplicate alerts, and a retrying HTTP client honors Retry-After with jittered backoff. 212 tests run in 1.5 s.',
      image: 'images/projects/autoapplybot.webp',
      links: [],
    },
    {
      title: 'EmFit',
      year: '2026',
      description: 'Instant file search and disk treemap for Windows, read straight from the NTFS MFT.',
      details:
        'Rust and Tauri; I wrote the whole v2 codebase. It sweeps a 3.4M-file drive in 11 to 14 s and reloads from its cache with USN journal replay in a median 2.3 s. An incremental sort repair runs 19x faster than a rebuild and was checked identical over 1,000 random patches.',
      image: 'images/projects/emfit.webp',
      links: [{ href: 'https://github.com/WCDAHT/EmFit/tree/staging', label: 'View on GitHub' }],
    },
    {
      title: 'COMRADE',
      year: '2026',
      description: 'A link-analysis board for investigators: people, notes and how they connect.',
      details:
        "A Rust, Tauri and Svelte rewrite of a Python tool, worked on at the DA's office. A headless Rust core traces how any two subjects connect with BFS shortest paths, flags likely duplicate people with Jaro-Winkler matching, and saves case files atomically with crash-recovery autosave. Board exports go through a hand-written PDF writer with no dependencies.",
      image: 'images/projects/comrade.webp',
      links: [{ href: wcdaht('COMRADE'), label: 'Read the README' }],
    },
    {
      title: 'Message Maestro',
      year: '2026',
      description: 'A forensic viewer for chat exports, with court-ready PDF reports.',
      details:
        "Another Rust, Tauri and Svelte rewrite from the DA's office. Five parsers read AXIOM, Discord, Kik, Snapchat and Twitter exports, streaming multi-GB XML at constant memory. Every derived file carries a SHA-256 provenance manifest, and one statistics engine feeds both the dashboard and the PDF, so they never disagree.",
      image: 'images/projects/message-maestro.webp',
      links: [{ href: wcdaht('Message-Maestro'), label: 'Read the README' }],
    },
    {
      title: 'NECCDC Labs',
      year: '2026',
      description: "Blue-team training and tryout labs for Pace's cyber defense team.",
      details:
        'First a 13-VM, dual-stack IPv4/IPv6 training lab across four subnets (pfSense, Active Directory, Teleport, Grafana, Falco), built in a month with Ansible hardening. Then an infrastructure-as-code tryouts lab: 4 pods for 16 candidates, graded by 47 automated assertions that are themselves tested against known-good and known-broken boxes.',
      image: 'images/projects/tryouts-lab.webp',
      links: [{ href: 'https://github.com/seidenbergcybersec/Pace-University-NECCDC-2026/tree/master/joe', label: 'View my scripts' }],
    },
    {
      title: 'chaptercut',
      year: '2025',
      description: 'A self-hosted Telegram bot that turns album uploads into tagged tracks.',
      details:
        'Python and asyncio, deployed with Docker Compose next to a self-hosted Telegram Bot API server that lifts the upload cap from 50 MB to 2 GB. Jobs run from a crash-safe SQLite queue, results land in an atomic on-disk cache, and yt-dlp and FFmpeg run as killable subprocesses. 514 tests, 89% coverage.',
      image: 'images/projects/chaptercut.webp',
      links: [{ href: 'https://github.com/jekuper/chaptercut', label: 'View source' }],
    },
  ],
};

export const backendContact: ContactData = {
  heading: "LET'S TALK",
  hint: 'Hover to see my email, click to copy it.',
  touchHint: 'Tap to copy my email.',
  copiedLabel: 'COPIED',
  topics: [
    { label: 'Hiring', word: 'HIRING?', icon: 'briefcase', subject: 'Hiring' },
    { label: 'Collaborate', word: "LET'S BUILD", icon: 'blocks', subject: 'Collaboration' },
    { label: 'Side project?', word: 'SIDE PROJECT?', icon: 'terminal', subject: 'Side project' },
    { label: 'Just saying hi', word: 'HI!', icon: 'smile', subject: 'Hello' },
  ],
  email: 'joesharipov@gmail.com',
  links,
  footer: 'Joe Sharipov',
};
