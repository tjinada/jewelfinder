import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ATTRIBUTES,
  METALS,
  METAL_LABELS,
  BANGLE_SIZES,
  NECKLACE_TYPES,
  NECKLACE_TYPE_LABELS,
  COLOURS,
  type Category,
} from '@jewel/shared';
import { Chip, Button } from '@/components/ui';
import { ATTRIBUTE_FILTER_KEYS, countActiveFilters, type SearchFilters } from './filters';

interface FilterSheetProps {
  open: boolean;
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-wide text-muted';

export function FilterSheet({ open, value, onChange, onClear, onClose }: FilterSheetProps) {
  // Which attribute filters to show: the chosen category's attributes, or all when none.
  const shownAttrs = value.category
    ? CATEGORY_ATTRIBUTES[value.category].filter((k) =>
        (ATTRIBUTE_FILTER_KEYS as readonly string[]).includes(k),
      )
    : ATTRIBUTE_FILTER_KEYS;

  const set = (patch: Partial<SearchFilters>) => onChange({ ...value, ...patch });

  const chooseCategory = (next?: Category) => {
    if (!next) {
      onChange({ ...value, category: undefined });
      return;
    }
    // Drop any attribute filters that don't apply to the new category.
    const allowed = CATEGORY_ATTRIBUTES[next];
    const cleaned: SearchFilters = { ...value, category: next };
    for (const key of ATTRIBUTE_FILTER_KEYS) {
      if (!allowed.includes(key)) cleaned[key] = undefined;
    }
    onChange(cleaned);
  };

  const active = countActiveFilters(value);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-hidden
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] cursor-default bg-ink/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-h-[85vh] max-w-lg overflow-y-auto rounded-t-3xl border-t border-white/60 bg-cream/95 px-5 pt-5 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] backdrop-blur-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Filters</h2>
              <div className="flex items-center gap-3">
                {active > 0 && (
                  <button onClick={onClear} className="text-sm font-semibold text-accent">
                    Clear all
                  </button>
                )}
                <button onClick={onClose} aria-label="Close" className="text-ink/50 hover:text-ink">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="mb-5">
              <span className={labelClass}>Category</span>
              <div className="flex flex-wrap gap-2">
                <Chip active={!value.category} onClick={() => chooseCategory(undefined)}>
                  All
                </Chip>
                {CATEGORIES.map((c) => (
                  <Chip key={c} active={value.category === c} onClick={() => chooseCategory(c)}>
                    {CATEGORY_LABELS[c]}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Metal */}
            {shownAttrs.includes('metal') && (
              <div className="mb-5">
                <span className={labelClass}>Metal</span>
                <div className="flex flex-wrap gap-2">
                  {METALS.map((m) => (
                    <Chip
                      key={m}
                      active={value.metal === m}
                      onClick={() => set({ metal: value.metal === m ? undefined : m })}
                    >
                      {METAL_LABELS[m]}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Necklace type */}
            {shownAttrs.includes('necklaceType') && (
              <div className="mb-5">
                <span className={labelClass}>Type</span>
                <div className="flex flex-wrap gap-2">
                  {NECKLACE_TYPES.map((t) => (
                    <Chip
                      key={t}
                      active={value.necklaceType === t}
                      onClick={() => set({ necklaceType: value.necklaceType === t ? undefined : t })}
                    >
                      {NECKLACE_TYPE_LABELS[t]}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {shownAttrs.includes('size') && (
              <div className="mb-5">
                <span className={labelClass}>Size</span>
                <div className="flex flex-wrap gap-2">
                  {BANGLE_SIZES.map((s) => (
                    <Chip
                      key={s}
                      active={value.size === s}
                      onClick={() => set({ size: value.size === s ? undefined : s })}
                    >
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Colour */}
            {shownAttrs.includes('colour') && (
              <div className="mb-6">
                <span className={labelClass}>Colour</span>
                <div className="flex flex-wrap gap-2">
                  {COLOURS.map((c) => (
                    <Chip
                      key={c.id}
                      active={value.colour === c.id}
                      onClick={() => set({ colour: value.colour === c.id ? undefined : c.id })}
                    >
                      {c.label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={onClose} className="w-full">
              Show results
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
