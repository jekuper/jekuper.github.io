import type { SectionType } from '../content/types';

/** Element id placed just before each section, for in-page navigation. */
export const sectionAnchor = (type: SectionType) => `section-${type}`;
