/**
 * Tile colours for closets, drawn from the secondary palette
 * (Dusty Rose, Warm Gold, Forest Emerald). Colours cycle by list position so
 * adjacent tiles never match. "My closet" gets the reserved deep brand emerald
 * with a gold edge.
 */
export interface TileColor {
  bg: string;
  text: string;
  sub: string;
}

export const MY_CLOSET_COLOR: TileColor = { bg: '#1A3A2E', text: '#F2E6C8', sub: '#C9A24A' };

const PALETTE: TileColor[] = [
  { bg: '#C4957A', text: '#2A2A2A', sub: '#5E3B29' }, // dusty rose
  { bg: '#D4AF6B', text: '#2A2A2A', sub: '#5F4A1C' }, // warm gold
  { bg: '#2D5C47', text: '#F2E6C8', sub: '#BFD3C9' }, // forest emerald
];

/**
 * Tile colour for a shared closet by its position in the list. Cycling by index
 * (rather than hashing the id) guarantees neighbours never share a colour, and
 * keeping emerald last keeps it away from the deep-emerald "My closet" tile.
 */
export function closetColor(index: number): TileColor {
  return PALETTE[index % PALETTE.length];
}
