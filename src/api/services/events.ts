import { applyQaDelay, applyQaForcedError, ApiClientError } from '../client';
import { mockState } from '../../mocks/state';
import { now } from '../../state/qa';
import type { Event } from '../types';

export type EventSort = 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc';

export type EventFilters = {
  q?: string;
  genre?: string;
  sort?: EventSort;
  /**
   * Include events whose `startsAt` is in the past. Default false — the
   * Events tab is for upcoming shows only. Past events are still
   * retrievable via getEvent() so a purchased ticket from a past show
   * still resolves on the ticket detail screen.
   */
  includePast?: boolean;
};

export type EventsPage = {
  items: Event[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export const EVENTS_PAGE_SIZE = 20;

export async function listEvents(
  filters: EventFilters = {},
  page = 0,
  pageSize: number = EVENTS_PAGE_SIZE,
): Promise<EventsPage> {
  await applyQaDelay();
  applyQaForcedError();
  const q = filters.q?.toLowerCase();
  const genre = filters.genre?.toLowerCase();
  let results = [...mockState.events];
  if (!filters.includePast) {
    const cutoff = now().getTime();
    results = results.filter((e) => new Date(e.startsAt).getTime() >= cutoff);
  }
  if (q) {
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.artist.toLowerCase().includes(q) ||
        e.venue.city.toLowerCase().includes(q),
    );
  }
  if (genre) {
    results = results.filter((e) => e.genre.toLowerCase() === genre);
  }
  switch (filters.sort ?? 'date_asc') {
    case 'date_desc':
      results.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
      break;
    case 'price_asc':
      results.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case 'price_desc':
      results.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case 'date_asc':
    default:
      results.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      break;
  }
  const total = results.length;
  const start = page * pageSize;
  const items = results.slice(start, start + pageSize);
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: start + items.length < total,
  };
}

export async function getEvent(id: string): Promise<Event> {
  await applyQaDelay();
  applyQaForcedError();
  const event = mockState.events.find((e) => e.id === id);
  if (!event) {
    throw new ApiClientError(404, { code: 'not_found', message: `Event ${id} not found.` });
  }
  return event;
}
