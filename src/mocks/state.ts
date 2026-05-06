import { seed } from './seed';
import type { Event, Ticket, User } from '../api/types';

type SeedUser = User & { password: string };

/**
 * In-memory state for the mock backend. Survives a session, gets re-seeded
 * by the QA Debug Menu via `applyScenario`.
 */
export const mockState = {
  events: [...seed.events] as Event[],
  users: [...seed.users] as SeedUser[],
  tickets: [...seed.tickets] as Ticket[],
  sessions: new Map<string, string>(), // token -> userId
};

/**
 * Reset seed-derived data back to fixture defaults. Intentionally preserves
 * `mockState.sessions` so a logged-in user keeps a valid token across scenario
 * changes — otherwise applying a scenario mid-session would 401 every API call
 * the app makes after.
 */
export function resetMockState(): void {
  mockState.events = [...seed.events];
  mockState.users = [...seed.users];
  mockState.tickets = [...seed.tickets];
}
