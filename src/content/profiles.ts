import { engineHelp, identity, links } from './identity';
import { about, achievements, contact, intro, journey, projects, skills } from './sections';
import type { Profile } from './types';

// Each profile is a page at /<id>/; role-specific pages are added here.
export const profiles: Record<string, Profile> = {
  gamedev: {
    id: 'gamedev',
    identity,
    links,
    engineHelp,
    nav: [
      { label: 'SKILLS', target: 'skills' },
      { label: 'ABOUT', target: 'about' },
      { label: 'JOURNEY', target: 'journey' },
      { label: 'ACHIEVEMENTS', target: 'achievements' },
      { label: 'PROJECTS', target: 'projects' },
      { label: 'CONTACT', target: 'contact' },
    ],
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
};

/** Where the site root redirects. */
export const DEFAULT_PROFILE = 'gamedev';
