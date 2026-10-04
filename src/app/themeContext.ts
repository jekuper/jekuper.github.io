import { createContext, useContext } from 'react';
import { purple } from '../content/themes';
import type { Theme } from '../content/types';

export const ThemeContext = createContext<Theme>(purple);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

const css = ({ r, g, b }: Theme['accent']) => `rgb(${r}, ${g}, ${b})`;

/** Publishes the theme as CSS variables on the document root. */
export function applyThemeCss(theme: Theme): void {
  const root = document.documentElement.style;
  const { r, g, b } = theme.accent;
  root.setProperty('--accent', css(theme.accent));
  root.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  root.setProperty('--accent-deep', css(theme.deep));
  root.setProperty('--accent-tint', css(theme.tint));
  root.setProperty('--accent-soft', css(theme.soft));
}
