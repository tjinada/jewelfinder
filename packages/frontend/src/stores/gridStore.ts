import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GridDensity = 2 | 3;

/** Fixed Tailwind classes per density — Tailwind needs literal class names, so
 *  these can't be built dynamically. Density controls columns at every width. */
export const gridColsClass: Record<GridDensity, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
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
    {
      name: 'clasp-grid',
      version: 1,
      // The "4 per row" option was removed; fold any stored 4 back to 3 (and
      // anything else unexpected to the default) so the grid never gets an
      // unknown column count.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<GridState> & { density?: number };
        if (state.density !== 2 && state.density !== 3) {
          state.density = state.density === 4 ? 3 : 2;
        }
        return state as GridState;
      },
    },
  ),
);
