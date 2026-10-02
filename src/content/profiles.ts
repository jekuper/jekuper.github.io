import { engineHelp, identity, links } from './identity';
import { about, contact, intro, projects, skills, stats } from './sections';
import type { Profile } from './types';

// Role-specific pages are added here and mapped to routes.
export const profiles: Record<string, Profile> = {
  default: {
    id: 'default',
    identity,
    links,
    engineHelp,
    hero: [
      { type: 'intro', data: intro, layouts: ['desktop'] },
      { type: 'skills', data: skills },
    ],
    sections: [
      { type: 'about', data: about },
      { type: 'stats', data: stats },
      { type: 'projects', data: projects },
      { type: 'contact', data: contact },
    ],
  },
};

export const defaultProfile = profiles.default;
