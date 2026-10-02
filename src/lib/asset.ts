/** Resolves a path under public/ against the deploy base. */
export function asset(path: string): string {
  return /^[a-z]+:/i.test(path) ? path : import.meta.env.BASE_URL + path;
}
