/**
 * Category + attribute configuration.
 *
 * This single source of truth drives BOTH the upload form (which inputs to show)
 * and search (which filters to show). Adding a category or attribute is a change
 * here only — no branching logic elsewhere (Open/Closed principle).
 */

// ---- Categories -------------------------------------------------------------
export const CATEGORIES = [
  'anklet',
  'bangle',
  'earring',
  'necklace',
  'earChain',
  'tikka',
  'ring',
  'waistChain',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  anklet: 'Anklet',
  bangle: 'Bangle',
  earring: 'Earring',
  necklace: 'Necklace',
  earChain: 'Ear chain',
  tikka: 'Tikka / Utchi pattam',
  ring: 'Ring',
  waistChain: 'Waist chain',
};

// ---- Attribute enums --------------------------------------------------------
export const METALS = ['gold', 'silver', 'bronze', 'pinkGold', 'pearl'] as const;
export type Metal = (typeof METALS)[number];
export const METAL_LABELS: Record<Metal, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  pinkGold: 'Pink gold',
  pearl: 'Pearl',
};

export const NECKLACE_TYPES = ['choker', 'long'] as const;
export type NecklaceType = (typeof NECKLACE_TYPES)[number];
export const NECKLACE_TYPE_LABELS: Record<NecklaceType, string> = {
  choker: 'Choker',
  long: 'Long',
};

export const BANGLE_SIZES = ['2.2', '2.4', '2.6', '2.8', '2.10'] as const;
export type BangleSize = (typeof BANGLE_SIZES)[number];

export const COLOURS = [
  { id: 'red', label: 'Red', hex: '#C0392B' },
  { id: 'maroon', label: 'Maroon', hex: '#7A1F2B' },
  { id: 'orange', label: 'Orange', hex: '#E07A2F' },
  { id: 'peach', label: 'Peach', hex: '#F0B27A' },
  { id: 'goldYellow', label: 'Gold Yellow', hex: '#E4C24A' },
  { id: 'green', label: 'Green', hex: '#3F7D5B' },
  { id: 'darkGreen', label: 'Dark Green', hex: '#1E5631' },
  { id: 'mint', label: 'Mint', hex: '#9DD9C0' },
  { id: 'blue', label: 'Blue', hex: '#2E6DB4' },
  { id: 'lightBlue', label: 'Light Blue', hex: '#7FB5E6' },
  { id: 'navyBlue', label: 'Navy Blue', hex: '#1F3F66' },
  { id: 'purple', label: 'Purple', hex: '#7E5AA0' },
  { id: 'lavender', label: 'Lavender', hex: '#B9A7D6' },
  { id: 'pink', label: 'Pink', hex: '#E8B4C4' },
  { id: 'white', label: 'White', hex: '#F4EFE6' },
  { id: 'multi', label: 'Multi colour', hex: 'multi' },
] as const;
export type ColourId = (typeof COLOURS)[number]['id'];
export const COLOUR_IDS = COLOURS.map((c) => c.id) as ColourId[];

export const AVAILABILITY = ['available', 'onLoan'] as const;
export type Availability = (typeof AVAILABILITY)[number];

// ---- Category -> attributes -------------------------------------------------
export type AttributeKey = 'metal' | 'colour' | 'size' | 'necklaceType' | 'set';

export const CATEGORY_ATTRIBUTES: Record<Category, AttributeKey[]> = {
  anklet: ['metal'],
  bangle: ['size', 'metal', 'colour'],
  earring: ['metal', 'colour', 'set'],
  necklace: ['necklaceType', 'metal', 'colour', 'set'],
  earChain: ['metal', 'colour', 'set'],
  tikka: ['metal', 'colour', 'set'],
  ring: ['colour', 'metal'],
  waistChain: ['metal'],
};

/** True if the given category supports being part of a set. */
export const categoryAllowsSet = (category: Category): boolean =>
  CATEGORY_ATTRIBUTES[category].includes('set');
