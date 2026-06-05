/**
 * Deterministic tile colours for closets, drawn from the secondary palette
 * (Forest Emerald, Dusty Rose, Warm Gold). The colour is derived from the closet
 * id so it stays stable across renders without needing a stored colour field.
 * "My closet" gets the reserved deep brand emerald with a gold edge.
 */
export interface TileColor {
  bg: string;
  text: string;
  sub: string;
}

export const MY_CLOSET_COLOR: TileColor = { bg: '#1A3A2E', text: '#F2E6C8', sub: '#C9A24A' };

const PALETTE: TileColor[] = [
  { bg: '#2D5C47', text: '#F2E6C8', sub: '#BFD3C9' }, // forest emerald
  { bg: '#C4957A', text: '#2A2A2A', sub: '#5E3B29' }, // dusty rose
  { bg: '#D4AF6B', text: '#2A2A2A', sub: '#5F4A1C' }, // warm gold
];

/** Stable colour for a closet, chosen from PALETTE by hashing its id. */
export function closetColor(id: string): TileColor {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
