import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useQueryClient } from '@tanstack/react-query';

import { scenarios, type ScenarioId } from '../mocks/seed/scenarios/registry';
import { useQaStore } from '../state/qa';
import { track } from '../state/analytics';

/**
 * Listens for `frontrow://debug/seed/<scenario_id>` deep links and applies the
 * matching scenario. Lets test flows put the app into a known state with one
 * `launchApp` directive: e.g.
 *
 *   - launchApp:
 *       url: "frontrow://debug/seed/expired_tickets"
 */
export function useDeepLinkScenario(): void {
  const qc = useQueryClient();
  const setScenario = useQaStore((s) => s.setScenario);

  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const path = parsed.path ?? '';
      const m = /^debug\/seed\/([\w-]+)$/.exec(path);
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
