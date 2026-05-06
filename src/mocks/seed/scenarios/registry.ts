import { resetMockState, mockState } from '../../state';

export type ScenarioId =
  | 'happy_path'
  | 'empty_state'
  | 'expired_tickets'
  | 'refund_pending'
  | 'many_events'
  | 'error_state'
  | 'slow_network'
  | 'offline';

export type Scenario = {
  id: ScenarioId;
  label: string;
  description: string;
  apply: () => void;
};

export const scenarios: Record<ScenarioId, Scenario> = {
  happy_path: {
    id: 'happy_path',
    label: 'Happy path',
    description: 'Demo user with one upcoming ticket and three favorited events.',
    apply() {
      resetMockState();
    },
  },
  empty_state: {
    id: 'empty_state',
    label: 'Empty state',
    description: 'Logged-out user with no data anywhere.',
    apply() {
      resetMockState();
      mockState.tickets = [];
      // Empty state explicitly signs everyone out.
      mockState.sessions.clear();
    },
  },
  expired_tickets: {
    id: 'expired_tickets',
    label: 'Expired tickets',
    description: "All of the user's tickets are in the past.",
    apply() {
      resetMockState();
      mockState.tickets = mockState.tickets.map((t) => ({ ...t, status: 'used' }));
    },
  },
  refund_pending: {
    id: 'refund_pending',
    label: 'Refund pending',
    description: "User's active ticket is mid-refund.",
    apply() {
      resetMockState();
      mockState.tickets = mockState.tickets.map((t, i) =>
        i === 0 ? { ...t, status: 'refund_pending' } : t,
      );
    },
  },
  many_events: {
    id: 'many_events',
    label: 'Many events (perf)',
    description: '200+ events for list-perf testing.',
    apply() {
      resetMockState();
      const base = mockState.events;
      const extras = Array.from({ length: 200 }, (_, i) => {
        const src = base[i % base.length]!;
        return { ...src, id: `evt_perf_${i + 1}`, title: `${src.title} (#${i + 1})` };
      });
      mockState.events = [...base, ...extras];
    },
  },
  error_state: {
    id: 'error_state',
    label: 'Error state',
    description: 'Next API call returns 5xx (configured via QA debug menu).',
    apply() {
      resetMockState();
    },
  },
  slow_network: {
    id: 'slow_network',
    label: 'Slow network',
    description: 'API responses delayed (configured via QA debug menu).',
    apply() {
      resetMockState();
    },
  },
  offline: {
    id: 'offline',
    label: 'Offline',
    description: 'Cached data only; no network.',
    apply() {
      resetMockState();
    },
  },
};
