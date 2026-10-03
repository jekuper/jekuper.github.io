import { DEFAULT_PROFILE, profiles } from '../content/profiles';
import type { Profile } from '../content/types';

/** The profile named by the first path segment; anything else redirects to the default one. */
export function resolveProfile(): Profile {
  const base = import.meta.env.BASE_URL;
  const path = window.location.pathname;
  const id = path.startsWith(base) ? path.slice(base.length).split('/')[0] : '';
  if (Object.hasOwn(profiles, id)) return profiles[id];
  const { search, hash } = window.location;
  window.history.replaceState(null, '', `${base}${DEFAULT_PROFILE}/${search}${hash}`);
  return profiles[DEFAULT_PROFILE];
}
