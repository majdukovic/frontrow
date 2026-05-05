import { create } from 'zustand';

export type AnalyticsEvent = {
  id: number;
  name: string;
  props?: Record<string, unknown>;
  at: string; // ISO
};

type AnalyticsState = {
  events: AnalyticsEvent[];
  track: (name: string, props?: Record<string, unknown>) => void;
  clear: () => void;
};

let counter = 0;

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  events: [],
  track(name, props) {
    counter += 1;
    const event: AnalyticsEvent = {
      id: counter,
      name,
      props,
      at: new Date().toISOString(),
    };
    set((state) => ({ events: [event, ...state.events].slice(0, 200) }));
  },
  clear() {
    set({ events: [] });
  },
}));

export function track(name: string, props?: Record<string, unknown>): void {
  useAnalyticsStore.getState().track(name, props);
}
