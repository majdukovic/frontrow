import { listEvents, getEvent } from '../events';
import { resetMockState, mockState } from '../../../mocks/state';
import { useQaStore } from '../../../state/qa';

beforeEach(() => {
  resetMockState();
  mockState.sessions.clear();
  useQaStore.setState({ forceError: 'none', networkDelayMs: 0 });
});

describe('events.listEvents', () => {
  it('returns the seed events sorted by date asc by default', async () => {
    const page = await listEvents();
    expect(page.items.length).toBeGreaterThan(0);
    for (let i = 1; i < page.items.length; i += 1) {
      expect(page.items[i - 1]!.startsAt.localeCompare(page.items[i]!.startsAt)).toBeLessThanOrEqual(
        0,
      );
    }
  });

  it('filters by genre', async () => {
    const page = await listEvents({ genre: 'classical' });
    expect(page.items.every((e) => e.genre.toLowerCase() === 'classical')).toBe(true);
  });

  it('filters by query against title / artist / city', async () => {
    const page = await listEvents({ q: 'aurora' });
    expect(page.items.length).toBeGreaterThan(0);
    expect(
      page.items.every(
        (e) =>
          e.title.toLowerCase().includes('aurora') ||
          e.artist.toLowerCase().includes('aurora') ||
          e.venue.city.toLowerCase().includes('aurora'),
      ),
    ).toBe(true);
  });

  it('sorts by price ascending', async () => {
    const page = await listEvents({ sort: 'price_asc' });
    for (let i = 1; i < page.items.length; i += 1) {
      expect(page.items[i - 1]!.priceCents).toBeLessThanOrEqual(page.items[i]!.priceCents);
    }
  });

  it('sorts by price descending', async () => {
    const page = await listEvents({ sort: 'price_desc' });
    for (let i = 1; i < page.items.length; i += 1) {
      expect(page.items[i - 1]!.priceCents).toBeGreaterThanOrEqual(page.items[i]!.priceCents);
    }
  });

  it('paginates correctly when more than pageSize events exist', async () => {
    // Bulk-seed extra events
    const base = mockState.events;
    const extras = Array.from({ length: 50 }, (_, i) => ({
      ...base[0]!,
      id: `evt_extra_${i}`,
    }));
    mockState.events = [...base, ...extras];
    const first = await listEvents({}, 0, 20);
    expect(first.items).toHaveLength(20);
    expect(first.hasMore).toBe(true);
    const second = await listEvents({}, 1, 20);
    expect(second.items).toHaveLength(20);
    expect(second.page).toBe(1);
  });
});

describe('events.listEvents past-event filter', () => {
  it('hides events whose startsAt is in the past by default', async () => {
    // evt_006 (Last Train Home) is seeded as 2025-11-15. Real now() is well
    // past that — it should be filtered out of the listing.
    const page = await listEvents();
    expect(page.items.find((e) => e.id === 'evt_006')).toBeUndefined();
  });

  it('returns past events when includePast is true', async () => {
    const page = await listEvents({ includePast: true });
    expect(page.items.find((e) => e.id === 'evt_006')).toBeDefined();
  });
});

describe('events.getEvent', () => {
  it('returns the event by id', async () => {
    const e = await getEvent('evt_001');
    expect(e.title).toBe('Midnight Howl Live in Brooklyn');
  });

  it('throws 404 for unknown id', async () => {
    await expect(getEvent('evt_does_not_exist')).rejects.toMatchObject({ status: 404 });
  });
});

describe('events.QA force-error gates', () => {
  it('throws when forceError is offline', async () => {
    useQaStore.setState({ forceError: 'offline' });
    await expect(listEvents()).rejects.toMatchObject({ status: 0, code: 'offline' });
  });

  it('throws when forceError is 5xx', async () => {
    useQaStore.setState({ forceError: '5xx' });
    await expect(listEvents()).rejects.toMatchObject({ status: 500 });
  });
});
