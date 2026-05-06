import { seed } from './seed';
import type {
  AppNotification,
  Artist,
  Event,
  PaymentMethod,
  Review,
  Ticket,
  User,
} from '../api/types';

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

// userId -> set of favorited event ids. Demo seed favorites three events
// so the happy_path scenario description matches reality.
const seedFavorites: Record<string, string[]> = {
  usr_demo: ['evt_001', 'evt_002', 'evt_003'],
};

const seedNotifications: AppNotification[] = [
  {
    id: 'ntf_001',
    userId: 'usr_demo',
    kind: 'event',
    title: 'Doors open in 1 hour',
    body: 'Aurora Lights at Warsaw, Brooklyn — gates lift at 7 PM.',
    eventId: 'evt_001',
    readAt: null,
    createdAt: '2026-05-04T17:00:00.000Z',
  },
  {
    id: 'ntf_002',
    userId: 'usr_demo',
    kind: 'promo',
    title: '25% off this weekend',
    body: 'Use code FRONTROW25 at checkout. Expires Sunday.',
    readAt: null,
    createdAt: '2026-05-03T09:00:00.000Z',
  },
  {
    id: 'ntf_003',
    userId: 'usr_demo',
    kind: 'ticket',
    title: 'Ticket transferred',
    body: 'Your transfer to friend@frontrow.app went through.',
    ticketId: 'tkt_002',
    readAt: '2026-05-02T22:00:00.000Z',
    createdAt: '2026-05-02T21:55:00.000Z',
  },
];

export const mockState = {
  events: [...seed.events] as Event[],
  users: [...seed.users] as SeedUser[],
  tickets: [...seed.tickets] as Ticket[],
  reviews: [...seedReviews] as Review[],
  paymentMethods: [...seedPaymentMethods] as PaymentMethod[],
  favorites: new Map<string, Set<string>>(
    Object.entries(seedFavorites).map(([uid, ids]) => [uid, new Set(ids)]),
  ),
  notifications: [...seedNotifications] as AppNotification[],
  artists: [...seed.artists] as Artist[],
  // userId -> set of followed artist ids
  follows: new Map<string, Set<string>>(),
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
  mockState.favorites = new Map(
    Object.entries(seedFavorites).map(([uid, ids]) => [uid, new Set(ids)]),
  );
  mockState.notifications = [...seedNotifications];
  mockState.artists = [...seed.artists];
  mockState.follows = new Map();
}
