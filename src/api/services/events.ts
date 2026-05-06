import { applyQaDelay, applyQaForcedError, ApiClientError } from '../client';
import { mockState } from '../../mocks/state';
import type { Event } from '../types';

export type EventFilters = {
  q?: string;
  genre?: string;
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
