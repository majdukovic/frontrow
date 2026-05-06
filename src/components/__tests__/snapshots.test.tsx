import { render } from '@testing-library/react-native';

import { EventListItem } from '../EventListItem';
import { HeroEventCard } from '../HeroEventCard';
import { EmptyState } from '../EmptyState';
import { OfflineBanner } from '../OfflineBanner';
import { useQaStore } from '../../state/qa';
import type { Event } from '../../api/types';

/**
 * Component-level snapshot tests. These are the cheapest layer of
 * "visual regression" we can ship without a full pixel-diff harness:
 * the snapshot is the rendered React tree, so any change in styling,
 * structure, or testID assignment fails the assertion until the
 * developer regenerates the snapshot deliberately.
 *
 * The trade-off vs a real pixel snapshot is that font rendering and
 * native platform differences aren't captured — for those, use Maestro
 * Cloud's screenshot diff feature on the smoke flows.
 */

const baseEvent: Event = {
  id: 'evt_snap',
  title: 'Snapshot Show',
  artist: 'Snapshot Artist',
  genre: 'Indie Rock',
  startsAt: '2030-06-12T20:00:00.000Z',
  doorsAt: '2030-06-12T19:00:00.000Z',
  venue: {
    id: 'ven_snap',
    name: 'Snapshot Venue',
    city: 'Brooklyn',
    country: 'US',
    lat: 0,
    lng: 0,
    capacity: 1000,
  },
  priceCents: 4500,
  currency: 'USD',
  imageUrl: 'https://example.com/x.jpg',
  soldOut: false,
  tags: [],
};

beforeEach(() => {
  useQaStore.setState({ forceError: 'none' });
});

describe('component snapshots', () => {
  it('EventListItem — default state', () => {
    const tree = render(<EventListItem event={baseEvent} onPress={() => undefined} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('EventListItem — sold out', () => {
    const tree = render(
      <EventListItem event={{ ...baseEvent, soldOut: true }} onPress={() => undefined} />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('HeroEventCard', () => {
    const tree = render(<HeroEventCard event={baseEvent} onPress={() => undefined} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('EmptyState — title only', () => {
    const tree = render(
      <EmptyState icon="ticket-outline" title="No tickets yet" testID="snap.empty" />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('EmptyState — title + body', () => {
    const tree = render(
      <EmptyState
        icon="search-outline"
        title="No events found"
        body="Try a different search term."
        testID="snap.empty"
      />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('OfflineBanner — hidden when forceError !== offline', () => {
    const tree = render(<OfflineBanner />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('OfflineBanner — visible when forceError === offline', () => {
    useQaStore.setState({ forceError: 'offline' });
    const tree = render(<OfflineBanner />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
