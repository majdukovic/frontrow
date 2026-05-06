import { create } from 'zustand';

import { store } from '../storage/asyncStore';

const NOTIFICATIONS_KEY = 'frontrow.settings.notifications';
const ONBOARDING_KEY = 'frontrow.settings.onboardingPending';

type SettingsState = {
  hydrated: boolean;
  notificationsEnabled: boolean;
  onboardingPending: boolean;
  hydrate: () => Promise<void>;
  setNotificationsEnabled: (v: boolean) => Promise<void>;
  startOnboarding: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  hydrated: false,
  notificationsEnabled: true,
  onboardingPending: false,
  async hydrate() {
    const [n, o] = await Promise.all([
      store.get<boolean>(NOTIFICATIONS_KEY),
      store.get<boolean>(ONBOARDING_KEY),
    ]);
    set({
      notificationsEnabled: n ?? true,
      onboardingPending: o ?? false,
      hydrated: true,
    });
  },
  async setNotificationsEnabled(v) {
    await store.set(NOTIFICATIONS_KEY, v);
    set({ notificationsEnabled: v });
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
