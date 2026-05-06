import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useQueryClient } from '@tanstack/react-query';

import { scenarios, type ScenarioId } from '../mocks/seed/scenarios/registry';
import { resetMockState } from '../mocks/state';
import { useQaStore, type FailureTrigger } from '../state/qa';
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
 * Listens for two debug deep links:
 *
 *   frontrow://debug/seed/<scenario_id>  → applies a seed scenario
 *   frontrow://debug/reset               → wipes in-memory mock state
 *                                          back to fixture defaults
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
      const segments = [parsed.hostname, parsed.path].filter(Boolean).join('/');

      if (/(?:^|\/)debug\/reset$/.test(segments)) {
        resetMockState();
        void setScenario(null);
        useQaStore.getState().clearTriggers();
        void qc.invalidateQueries();
        track('debug.mockState.reset');
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
      void setScenario(id);
      void qc.invalidateQueries();
      track('debug.scenario.applied', { id });
    };

    void Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [qc, setScenario]);
}
