import { create } from 'zustand';

import { store, storeKeys } from '../storage/asyncStore';

type ForceErrorMode = 'none' | '4xx' | '5xx' | 'timeout' | 'offline';

/**
 * Domain-specific failure triggers. Each is a session-only flag (not
 * persisted) that causes the corresponding flow to fail in a
 * deterministic, testable way:
 *   push          — local push delivery throws (NotificationsDemo)
 *   geolocation   — location permission resolves "denied"
 *   camera        — camera permission resolves "denied"
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
  | 'imageUpload'
  | 'sessionExpired'
  | 'paymentTimeout'
  | 'reviewSubmit';

export type FailureTriggers = Record<FailureTrigger, boolean>;

const EMPTY_TRIGGERS: FailureTriggers = {
  push: false,
  geolocation: false,
  camera: false,
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
  locale: string | null;
  triggers: FailureTriggers;

  hydrate: () => Promise<void>;
  setQaMode: (v: boolean) => void;
  setTimeOffsetMs: (ms: number) => Promise<void>;
  setScenario: (id: string | null) => Promise<void>;
  setForceError: (mode: ForceErrorMode) => Promise<void>;
  setNetworkDelayMs: (ms: number) => Promise<void>;
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
  locale: null,
  triggers: { ...EMPTY_TRIGGERS },

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
