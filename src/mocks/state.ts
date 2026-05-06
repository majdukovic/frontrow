import { seed } from './seed';
import type { Event, PaymentMethod, Review, Ticket, User } from '../api/types';

type SeedUser = User & { password: string };

const seedReviews: Review[] = [
  {
    id: 'rev_001',
    eventId: 'evt_001',
    userId: 'usr_demo',
    authorName: 'Demo User',
    rating: 5,
    text: 'Absolutely incredible. Front row energy.',
    createdAt: '2026-04-15T22:30:00.000Z',
  },
  {
    id: 'rev_002',
    eventId: 'evt_001',
    userId: 'usr_other',
    authorName: 'Alex Rivera',
    rating: 4,
    text: 'Sound mix in the back was a bit muddy but the band was tight.',
    createdAt: '2026-04-14T20:11:00.000Z',
  },
  {
    id: 'rev_003',
    eventId: 'evt_002',
    userId: 'usr_demo',
    authorName: 'Demo User',
    rating: 5,
    text: 'A timeless venue and a flawless performance.',
    createdAt: '2026-03-21T11:45:00.000Z',
  },
];

/**
 * In-memory state for the mock backend. Survives a session, gets re-seeded
 * by the QA Debug Menu via `applyScenario`.
 */
const seedPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_001',
    userId: 'usr_demo',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2030,
    cardholder: 'Demo User',
    isDefault: true,
    createdAt: '2025-12-01T10:00:00.000Z',
  },
];

export const mockState = {
  events: [...seed.events] as Event[],
  users: [...seed.users] as SeedUser[],
  tickets: [...seed.tickets] as Ticket[],
  reviews: [...seedReviews] as Review[],
  paymentMethods: [...seedPaymentMethods] as PaymentMethod[],
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
  mockState.reviews = [...seedReviews];
  mockState.paymentMethods = [...seedPaymentMethods];
}
