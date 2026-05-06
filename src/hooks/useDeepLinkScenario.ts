import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useQueryClient } from '@tanstack/react-query';

import { scenarios, type ScenarioId } from '../mocks/seed/scenarios/registry';
import { mockState, resetMockState } from '../mocks/state';
import { useQaStore, type FailureTrigger } from '../state/qa';
import { useAuthStore } from '../state/auth';
import { useBillingStore, type PurchaseOutcome } from '../state/billing';
import { useSettingsStore } from '../state/settings';
import { track } from '../state/analytics';

const TRIGGER_NAMES: readonly FailureTrigger[] = [
  'push',
  'geolocation',
  'camera',
  'biometric',
  'imageUpload',
  'sessionExpired',
  'paymentTimeout',
  'reviewSubmit',
];

/**
 * Listens for the QA + E2E deep links:
 *
 *   frontrow://debug/seed/<scenario_id>  → applies a seed scenario
 *   frontrow://debug/reset               → wipes in-memory mock state
 *                                          back to fixture defaults
 *   frontrow://debug/trigger/<kind>[/on|/off]
 *                                        → toggles a failure trigger
 *   frontrow://e2e/setup                 → fast-boot: signs in demo
 *                                          user, completes onboarding,
 *                                          resets mock state, clears
 *                                          triggers. Replaces the
 *                                          7-tap login flow with one
 *                                          openLink. ~5–8s saved per
 *                                          flow that needs auth.
 *
 * MMKV (`launchApp: clearState: true`) only resets persisted state — the
 * in-process `mockState` survives between flows in a Maestro session.
 * The reset deep link gives flows a deterministic "blank slate" before
 * they start mutating.
 */
export function useDeepLinkScenario(): void {
  const qc = useQueryClient();
  const setScenario = useQaStore((s) => s.setScenario);

  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      // expo-linking may emit path with a leading slash, producing
      // a double slash when joined ("debug//forceError/5xx") that
      // breaks downstream regexes. Collapse runs of `/` so all
      // matchers can assume a normalized form.
      const segments = [parsed.hostname, parsed.path]
        .filter(Boolean)
        .join('/')
        .replace(/\/{2,}/g, '/');

      if (/(?:^|\/)debug\/reset$/.test(segments)) {
        resetMockState();
        void setScenario(null);
        useQaStore.getState().clearTriggers();
        void qc.invalidateQueries();
        track('debug.mockState.reset');
        return;
      }

      // frontrow://debug/replayOnboarding — sets onboardingPending so
      // flows can drive the onboarding UI without scrolling the debug
      // screen to find the replay button. Mirrors the debug-menu row
      // but is reachable in one step from any state.
      if (/(?:^|\/)debug\/replayOnboarding$/.test(segments)) {
        void useSettingsStore.getState().startOnboarding();
        track('debug.onboarding.replay');
        return;
      }

      // frontrow://debug/iap/<outcome> — set the in-app-purchase
      // outcome (success / decline / cancel / pending). Avoids the
      // scroll-to-IAP-section dance on the now-13-section debug
      // screen.
      const iap = /(?:^|\/)debug\/iap\/(success|decline|cancel|pending)$/.exec(segments);
      if (iap) {
        const outcome = iap[1] as PurchaseOutcome;
        void useBillingStore.getState().setOutcome(outcome);
        track('debug.iap.outcome.set', { outcome });
        return;
      }

      // frontrow://debug/forceError/<mode> — set the API-level forced
      // error mode (none / 4xx / 5xx / timeout / offline). Same
      // scroll-bypass rationale.
      const forceErr = /(?:^|\/)debug\/forceError\/(none|4xx|5xx|timeout|offline)$/.exec(
        segments,
      );
      if (forceErr) {
        const mode = forceErr[1] as 'none' | '4xx' | '5xx' | 'timeout' | 'offline';
        // setForceError is async (writes MMKV then sets state) — chain
        // invalidateQueries after it completes so the refetch sees the
        // new forceError value, not the stale one.
        void useQaStore
          .getState()
          .setForceError(mode)
          .then(() => qc.invalidateQueries());
        track('debug.forceError.set', { mode });
        return;
      }

      // Fast-boot for E2E: pre-auth + onboarding-done + clean state in
      // one openLink. Saves the ~7 taps + ~5s per auth-needing flow.
      if (/(?:^|\/)e2e\/setup$/.test(segments)) {
        resetMockState();
        useQaStore.getState().clearTriggers();
        void setScenario(null);
        const demo = mockState.users.find((u) => u.id === 'usr_demo');
        if (demo) {
          const token = `e2e_${demo.id}_${Date.now()}`;
          mockState.sessions.set(token, demo.id);
          // password is on the seed shape but not on User — strip it
          // so the auth-store user matches the API contract.
          const { password: _pw, ...user } = demo;
          void useAuthStore.getState().setSession(token, user);
        }
        // Mark onboarding as done so flows that clearState don't bounce
        // through the onboarding screen on the next launch.
        void useSettingsStore.getState().finishOnboarding();
        void qc.invalidateQueries();
        track('e2e.setup');
        return;
      }

      const trig = /(?:^|\/)debug\/trigger\/([\w-]+)(?:\/(on|off))?$/.exec(segments);
      if (trig) {
        const kind = trig[1] as FailureTrigger;
        const next = trig[2] === 'off' ? false : true;
        if (TRIGGER_NAMES.includes(kind)) {
          useQaStore.getState().setTrigger(kind, next);
          track('debug.trigger.set', { kind, on: next });
        }
        return;
      }

      const m = /(?:^|\/)debug\/seed\/([\w-]+)$/.exec(segments);
      if (!m) return;
      const id = m[1] as ScenarioId;
      const scenario = scenarios[id];
      if (!scenario) return;
      scenario.apply();
      // Sync mockState mutation already happened in scenario.apply().
      // Persist the scenario id, then invalidate so cached queries
      // refetch with the new mockState.
      void setScenario(id).then(() => qc.invalidateQueries());
      track('debug.scenario.applied', { id });
    };

    void Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [qc, setScenario]);
}
