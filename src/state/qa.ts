import { create } from 'zustand';

import { store, storeKeys } from '../storage/asyncStore';

type ForceErrorMode = 'none' | '4xx' | '5xx' | 'timeout' | 'offline';

type QaState = {
  hydrated: boolean;
  qaMode: boolean;
  timeOffsetMs: number;
  scenario: string | null;
  forceError: ForceErrorMode;
  networkDelayMs: number;
  locale: string | null;

  hydrate: () => Promise<void>;
  setQaMode: (v: boolean) => void;
  setTimeOffsetMs: (ms: number) => Promise<void>;
  setScenario: (id: string | null) => Promise<void>;
  setForceError: (mode: ForceErrorMode) => Promise<void>;
  setNetworkDelayMs: (ms: number) => Promise<void>;
  setLocale: (locale: string | null) => Promise<void>;
  reset: () => Promise<void>;
};

export const useQaStore = create<QaState>((set) => ({
  hydrated: false,
  qaMode: __DEV__,
  timeOffsetMs: 0,
  scenario: null,
  forceError: 'none',
  networkDelayMs: 0,
  locale: null,

  async hydrate() {
    const [timeOffsetMs, scenario, forceError, networkDelayMs, locale] = await Promise.all([
      store.get<number>(storeKeys.qaTimeOffsetMs),
      store.get<string>(storeKeys.qaScenario),
      store.get<ForceErrorMode>(storeKeys.qaForceError),
      store.get<number>(storeKeys.qaNetworkDelayMs),
      store.get<string>(storeKeys.qaLocale),
    ]);
    set({
      timeOffsetMs: timeOffsetMs ?? 0,
      scenario: scenario ?? null,
      forceError: forceError ?? 'none',
      networkDelayMs: networkDelayMs ?? 0,
      locale: locale ?? null,
      hydrated: true,
    });
  },
  setQaMode(v) {
    set({ qaMode: v });
  },
  async setTimeOffsetMs(ms) {
    await store.set(storeKeys.qaTimeOffsetMs, ms);
    set({ timeOffsetMs: ms });
  },
  async setScenario(id) {
    if (id == null) await store.remove(storeKeys.qaScenario);
    else await store.set(storeKeys.qaScenario, id);
    set({ scenario: id });
  },
  async setForceError(mode) {
    await store.set(storeKeys.qaForceError, mode);
    set({ forceError: mode });
  },
  async setNetworkDelayMs(ms) {
    await store.set(storeKeys.qaNetworkDelayMs, ms);
    set({ networkDelayMs: ms });
  },
  async setLocale(locale) {
    if (locale == null) await store.remove(storeKeys.qaLocale);
    else await store.set(storeKeys.qaLocale, locale);
    set({ locale });
  },
  async reset() {
    await store.clearNamespace('frontrow.qa.');
    set({
      timeOffsetMs: 0,
      scenario: null,
      forceError: 'none',
      networkDelayMs: 0,
      locale: null,
    });
  },
}));

/**
 * `now()` respects the QA time-travel offset. Use this anywhere you would
 * otherwise call `Date.now()` or `new Date()` for app-visible time.
 */
export function now(): Date {
  const offset = useQaStore.getState().timeOffsetMs;
  return new Date(Date.now() + offset);
}
