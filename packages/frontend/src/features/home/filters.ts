import type { Category } from '@jewel/shared';

/** Filters shared between the search page and the filter sheet. */
export interface SearchFilters {
  category?: Category;
  metal?: string;
  colour?: string;
  size?: string;
  necklaceType?: string;
}

export const ATTRIBUTE_FILTER_KEYS = ['metal', 'colour', 'size', 'necklaceType'] as const;

/** Count of active (set) filters — drives the badge on the Filters button. */
export function countActiveFilters(f: SearchFilters): number {
  return (Object.keys(f) as (keyof SearchFilters)[]).filter((k) => f[k]).length;
}
