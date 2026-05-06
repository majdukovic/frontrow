import { create } from 'zustand';

import { store, storeKeys } from '../storage/asyncStore';

type ForceErrorMode = 'none' | '4xx' | '5xx' | 'timeout' | 'offline';

/**
 * Named network profiles. These compose latency + offline-ness into a
 * single named knob so flows can practice well-known conditions without
 * remembering ms values. Picking a profile updates both `networkDelayMs`
 * and (for `offline`) `forceError`.
 */
export type NetworkProfile = 'online' | 'slow4g' | 'fast3g' | 'slow3g' | 'offline';

export const NETWORK_PROFILES: { id: NetworkProfile; label: string; delayMs: number }[] = [
  { id: 'online', label: 'Online', delayMs: 0 },
  { id: 'slow4g', label: 'Slow 4G', delayMs: 300 },
  { id: 'fast3g', label: 'Fast 3G', delayMs: 800 },
  { id: 'slow3g', label: 'Slow 3G', delayMs: 2500 },
  { id: 'offline', label: 'Offline', delayMs: 0 },
];

/**
 * Domain-specific failure triggers. Each is a session-only flag (not
 * persisted) that causes the corresponding flow to fail in a
 * deterministic, testable way:
 *   push          — local push delivery throws (NotificationsDemo)
 *   geolocation   — location permission resolves "denied"
 *   camera        — camera permission resolves "denied"
 *   biometric     — biometric probe reports unavailable; auth fails
 *   imageUpload   — image picker / upload throws an upload error
 *   sessionExpired— every API call throws 401 session-expired
 *   paymentTimeout— purchaseTicket throws a 504 payment timeout
 *   reviewSubmit  — postReview throws a 503 service-unavailable
 *
 * Triggers compose: setting two of them at once produces both failures.
 * `forceError` is the generic API-level toggle; these are flow-level.
 */
export type FailureTrigger =
  | 'push'
  | 'geolocation'
  | 'camera'
  | 'biometric'
  | 'imageUpload'
  | 'sessionExpired'
  | 'paymentTimeout'
  | 'reviewSubmit';

export type FailureTriggers = Record<FailureTrigger, boolean>;

const EMPTY_TRIGGERS: FailureTriggers = {
  push: false,
  geolocation: false,
  camera: false,
  biometric: false,
  imageUpload: false,
  sessionExpired: false,
  paymentTimeout: false,
  reviewSubmit: false,
};

type QaState = {
  hydrated: boolean;
  qaMode: boolean;
  timeOffsetMs: number;
  scenario: string | null;
  forceError: ForceErrorMode;
  networkDelayMs: number;
  networkProfile: NetworkProfile;
  locale: string | null;
  triggers: FailureTriggers;

  hydrate: () => Promise<void>;
  setQaMode: (v: boolean) => void;
  setTimeOffsetMs: (ms: number) => Promise<void>;
  setScenario: (id: string | null) => Promise<void>;
  setForceError: (mode: ForceErrorMode) => Promise<void>;
  setNetworkDelayMs: (ms: number) => Promise<void>;
  setNetworkProfile: (id: NetworkProfile) => Promise<void>;
  setLocale: (locale: string | null) => Promise<void>;
  setTrigger: (kind: FailureTrigger, on: boolean) => void;
  clearTriggers: () => void;
  reset: () => Promise<void>;
};

export const useQaStore = create<QaState>((set) => ({
  hydrated: false,
  qaMode: __DEV__,
  timeOffsetMs: 0,
  scenario: null,
  forceError: 'none',
  networkDelayMs: 0,
  networkProfile: 'online',
  locale: null,
  triggers: { ...EMPTY_TRIGGERS },

  async hydrate() {
    const [timeOffsetMs, scenario, forceError, networkDelayMs, networkProfile, locale] =
      await Promise.all([
        store.get<number>(storeKeys.qaTimeOffsetMs),
        store.get<string>(storeKeys.qaScenario),
        store.get<ForceErrorMode>(storeKeys.qaForceError),
        store.get<number>(storeKeys.qaNetworkDelayMs),
        store.get<NetworkProfile>(storeKeys.qaNetworkProfile),
        store.get<string>(storeKeys.qaLocale),
      ]);
    set({
      timeOffsetMs: timeOffsetMs ?? 0,
      scenario: scenario ?? null,
      forceError: forceError ?? 'none',
      networkDelayMs: networkDelayMs ?? 0,
      networkProfile: networkProfile ?? 'online',
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
  async setNetworkProfile(id) {
    const profile = NETWORK_PROFILES.find((p) => p.id === id);
    if (!profile) return;
    await Promise.all([
      store.set(storeKeys.qaNetworkProfile, id),
      store.set(storeKeys.qaNetworkDelayMs, profile.delayMs),
    ]);
    set({ networkProfile: id, networkDelayMs: profile.delayMs });
    // Offline preset doubles as the offline forceError so request paths
    // that bail on connectivity behave consistently.
    if (id === 'offline') {
      await store.set(storeKeys.qaForceError, 'offline');
      set({ forceError: 'offline' });
    } else if (useQaStore.getState().forceError === 'offline') {
      // Leaving the offline preset auto-clears the offline forceError so
      // testers don't have to remember to flip it back manually.
      await store.set(storeKeys.qaForceError, 'none');
      set({ forceError: 'none' });
    }
  },
  async setLocale(locale) {
    if (locale == null) await store.remove(storeKeys.qaLocale);
    else await store.set(storeKeys.qaLocale, locale);
    set({ locale });
  },
  setTrigger(kind, on) {
    set((s) => ({ triggers: { ...s.triggers, [kind]: on } }));
  },
  clearTriggers() {
    set({ triggers: { ...EMPTY_TRIGGERS } });
  },
  async reset() {
    await store.clearNamespace('frontrow.qa.');
    set({
      timeOffsetMs: 0,
      scenario: null,
      forceError: 'none',
      networkDelayMs: 0,
      networkProfile: 'online',
      locale: null,
      triggers: { ...EMPTY_TRIGGERS },
    });
  },
}));

/**
 * Throws if the named failure trigger is on. Used by capability handlers
 * and service functions to surface deterministic failures from a single
 * QA-store flag.
 */
export function failIfTriggered(kind: FailureTrigger, message?: string): void {
  if (useQaStore.getState().triggers[kind]) {
    const err = new Error(message ?? `QA failure trigger '${kind}' is on.`);
    (err as Error & { code: string }).code = `qa_trigger_${kind}`;
    throw err;
  }
}

/**
 * `now()` respects the QA time-travel offset. Use this anywhere you would
 * otherwise call `Date.now()` or `new Date()` for app-visible time.
 */
export function now(): Date {
  const offset = useQaStore.getState().timeOffsetMs;
  return new Date(Date.now() + offset);
}
