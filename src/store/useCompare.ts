'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type State = {
  selected: string[];
  checkedSpecs: Set<string>;
  addMoto: (id: string) => void;
  removeMoto: (id: string) => void;
  toggleSpec: (key: string) => void;
  hydrateQS: (ids: string[]) => void;
};

export const useCompare = create<State>()(
  persist(
    (set) => ({
      selected: [],
      checkedSpecs: new Set<string>(),
      addMoto: (id) =>
        set((s) => {
          if (!id) return s;
          if (s.selected.includes(id)) return s;
          if (s.selected.length >= 4) return s;
          return { selected: [...s.selected, id] };
        }),
      removeMoto: (id) =>
        set((s) => ({ selected: s.selected.filter((x) => x !== id) })),
      toggleSpec: (key) =>
        set((s) => {
          const n = new Set(s.checkedSpecs);
          n.has(key) ? n.delete(key) : n.add(key);
          return { checkedSpecs: n };
        }),
      hydrateQS: (ids) =>
        set({ selected: ids.filter(Boolean).slice(0, 4) }),
    }),
    {
      name: 'compare-motos',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selected: state.selected,
        checkedSpecs: Array.from(state.checkedSpecs),
      }),
      merge: (persisted, current) => {
        const p = persisted as any;
        return {
          ...current,
          ...p,
          checkedSpecs: new Set(p.checkedSpecs || []),
        } as State;
      },
    }
  )
);

