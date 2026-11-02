import type { EngineHelp, Identity, SocialLink } from './types';

export const identity: Identity = {
  name: 'Joe Sharipov',
  title: 'Software Engineer',
  location: ['United States of America', 'New York', 'NY'],
};

export const links: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jekuper/', icon: 'images/social/linkedin.png' },
  { label: 'Email', href: 'mailto:joesharipov@gmail.com', icon: 'images/social/email.png' },
  { label: 'GitHub', href: 'https://github.com/jekuper', icon: 'images/social/github.png' },
  { label: 'itch.io', href: 'https://jekuper.itch.io/', icon: 'images/social/itchio.png' },
];

export const engineHelp: EngineHelp = {
  hint: [
    { input: 'Left Mouse Click', effect: 'Black Hole' },
    { input: 'CTRL + Left Mouse Click', effect: 'ANTI Black Hole' },
    { input: 'Left Mouse Hold and Move', effect: 'Bomb' },
    { input: 'Right Mouse Click', effect: 'Eraser' },
  ],
};
