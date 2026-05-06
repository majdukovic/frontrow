import { create } from 'zustand';

import { store } from '../storage/asyncStore';

const KEY = 'frontrow.events.recentlyViewed';
const MAX = 10;

type RecentlyViewedState = {
  hydrated: boolean;
  ids: string[];
  hydrate: () => Promise<void>;
  push: (id: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useRecentlyViewedStore = create<RecentlyViewedState>((set, get) => ({
  hydrated: false,
  ids: [],
  async hydrate() {
    const stored = await store.get<string[]>(KEY);
    set({ ids: stored ?? [], hydrated: true });
  },
  async push(id) {
    const current = get().ids;
    const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX);
    await store.set(KEY, next);
    set({ ids: next });
  },
  async clear() {
    await store.remove(KEY);
    set({ ids: [] });
  },
}));
