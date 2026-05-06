import { create } from 'zustand';

import { store } from '../storage/asyncStore';

const NOTIFICATIONS_KEY = 'frontrow.settings.notifications';
const ONBOARDING_KEY = 'frontrow.settings.onboardingPending';
const APPEARANCE_KEY = 'frontrow.settings.appearance';

export type Appearance = 'system' | 'light' | 'dark';

type SettingsState = {
  hydrated: boolean;
  notificationsEnabled: boolean;
  onboardingPending: boolean;
  appearance: Appearance;
  hydrate: () => Promise<void>;
  setNotificationsEnabled: (v: boolean) => Promise<void>;
  setAppearance: (v: Appearance) => Promise<void>;
  startOnboarding: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  hydrated: false,
  notificationsEnabled: true,
  onboardingPending: false,
  appearance: 'system',
  async hydrate() {
    const [n, o, a] = await Promise.all([
      store.get<boolean>(NOTIFICATIONS_KEY),
      store.get<boolean>(ONBOARDING_KEY),
      store.get<Appearance>(APPEARANCE_KEY),
    ]);
    set({
      notificationsEnabled: n ?? true,
      onboardingPending: o ?? false,
      appearance: a ?? 'system',
      hydrated: true,
    });
  },
  async setNotificationsEnabled(v) {
    await store.set(NOTIFICATIONS_KEY, v);
    set({ notificationsEnabled: v });
  },
  async setAppearance(v) {
    await store.set(APPEARANCE_KEY, v);
    set({ appearance: v });
  },
  async startOnboarding() {
    await store.set(ONBOARDING_KEY, true);
    set({ onboardingPending: true });
  },
  async finishOnboarding() {
    await store.remove(ONBOARDING_KEY);
    set({ onboardingPending: false });
  },
}));
