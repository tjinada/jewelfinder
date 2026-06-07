import {
  CATEGORY_LABELS,
  NECKLACE_TYPE_LABELS,
  type JewelryItem,
} from '@jewel/shared';

/** Display title: the optional name, otherwise the category label. */
export function itemTitle(item: Pick<JewelryItem, 'name' | 'category'>): string {
  return item.name?.trim() || CATEGORY_LABELS[item.category];
}

/** Subtitle built from whichever attributes are present, e.g. "Choker · Size 18". */
export function itemSubtitle(item: JewelryItem): string {
  const parts: string[] = [];
  if (item.necklaceType) parts.push(NECKLACE_TYPE_LABELS[item.necklaceType]);
  if (item.size) parts.push(`Size ${item.size}`);
  return parts.join(' · ');
}
