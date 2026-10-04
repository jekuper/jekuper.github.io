import { backendAbout, backendContact, backendJourney, backendProjects, backendSkills } from './backend';
import { engineHelp, identity, links } from './identity';
import { about, achievements, contact, intro, journey, projects, skills } from './sections';
import { orange, purple } from './themes';
import type { NavItem, Profile } from './types';

const nav: NavItem[] = [
  { label: 'SKILLS', target: 'skills' },
  { label: 'ABOUT', target: 'about' },
  { label: 'JOURNEY', target: 'journey' },
  { label: 'ACHIEVEMENTS', target: 'achievements' },
  { label: 'PROJECTS', target: 'projects' },
  { label: 'CONTACT', target: 'contact' },
];

// Each profile is a page at /<id>/; role-specific pages are added here.
export const profiles: Record<string, Profile> = {
  gamedev: {
    id: 'gamedev',
    tagline: 'Unity, netcode and games I actually shipped.',
    theme: purple,
    identity: { ...identity, title: 'Game Developer' },
    links,
    engineHelp,
    nav,
    hero: [
      { type: 'intro', data: intro },
      { type: 'skills', data: skills },
    ],
    sections: [
      { type: 'about', data: about },
      { type: 'journey', data: journey },
      { type: 'achievements', data: achievements },
      { type: 'projects', data: projects },
      { type: 'contact', data: contact },
    ],
  },
  backend: {
    id: 'backend',
    tagline: 'Rust services, CI/CD and servers that stay up.',
    theme: orange,
    identity: { ...identity, title: 'Backend Developer' },
    links,
    engineHelp,
    nav,
    hero: [
      { type: 'intro', data: intro },
      { type: 'skills', data: backendSkills },
    ],
    sections: [
      { type: 'about', data: backendAbout },
      { type: 'journey', data: backendJourney },
      { type: 'achievements', data: achievements },
      { type: 'projects', data: backendProjects },
      { type: 'contact', data: backendContact },
    ],
  },
};
