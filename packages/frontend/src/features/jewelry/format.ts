import {
  CATEGORY_LABELS,
  METAL_LABELS,
  NECKLACE_TYPE_LABELS,
  COLOURS,
  type JewelryItem,
} from '@jewel/shared';

const colourLabel = (id?: string): string | undefined => COLOURS.find((c) => c.id === id)?.label;

/** Display title: the optional name, otherwise the category label. */
export function itemTitle(item: Pick<JewelryItem, 'name' | 'category'>): string {
  return item.name?.trim() || CATEGORY_LABELS[item.category];
}

/** Subtitle built from whichever attributes are present, e.g. "Gold · Maroon · Choker". */
export function itemSubtitle(item: JewelryItem): string {
  const parts: string[] = [];
  if (item.metal) parts.push(METAL_LABELS[item.metal]);
  const colour = colourLabel(item.colour);
  if (colour) parts.push(colour);
  if (item.necklaceType) parts.push(NECKLACE_TYPE_LABELS[item.necklaceType]);
  if (item.size) parts.push(`Size ${item.size}`);
  return parts.join(' · ');
}
