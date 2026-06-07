import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GridDensity = 2 | 3 | 4;

/** Fixed Tailwind classes per density — Tailwind needs literal class names, so
 *  these can't be built dynamically. Density controls columns at every width. */
export const gridColsClass: Record<GridDensity, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

interface GridState {
  /** Items per row in jewelry grids (Discover, closets, my closet). */
  density: GridDensity;
  setDensity: (density: GridDensity) => void;
}

export const useGridStore = create<GridState>()(
  persist(
    (set) => ({
      density: 2,
      setDensity: (density) => set({ density }),
    }),
    { name: 'clasp-grid' },
  ),
);
