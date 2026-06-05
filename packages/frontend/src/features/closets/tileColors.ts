/**
 * Deterministic tile colours for closets, drawn from the brand palette.
 * The colour is derived from the closet id so it stays stable across renders
 * without needing a stored colour field. "My closet" gets a reserved teal.
 */
export interface TileColor {
  bg: string;
  text: string;
  sub: string;
}

export const MY_CLOSET_COLOR: TileColor = { bg: '#9FE1CB', text: '#04342C', sub: '#0F6E56' };

const PALETTE: TileColor[] = [
  { bg: '#F4C0D1', text: '#4B1528', sub: '#993556' }, // pink
  { bg: '#FAC775', text: '#412402', sub: '#854F0B' }, // amber
  { bg: '#CECBF6', text: '#26215C', sub: '#534AB7' }, // purple
  { bg: '#F5C4B3', text: '#4A1B0C', sub: '#993C1D' }, // coral
  { bg: '#B5D4F4', text: '#042C53', sub: '#185FA5' }, // blue
  { bg: '#C0DD97', text: '#173404', sub: '#3B6D11' }, // green
];

/** Stable colour for a closet, chosen from PALETTE by hashing its id. */
export function closetColor(id: string): TileColor {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
