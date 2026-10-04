import { profiles } from '../content/profiles';
import type { Profile } from '../content/types';

/** The profile named by the first path segment, or null for the picker at the site root. */
export function resolveProfile(): Profile | null {
  const base = import.meta.env.BASE_URL;
  const path = window.location.pathname;
  const id = path.startsWith(base) ? path.slice(base.length).split('/')[0] : '';
  if (Object.hasOwn(profiles, id)) return profiles[id];
  // Anything unknown lands on the picker too, at the plain root address.
  if (id) {
    const { search, hash } = window.location;
    window.history.replaceState(null, '', `${base}${search}${hash}`);
  }
  return null;
}
