import { render, fireEvent } from '@testing-library/react-native';

import { EventListItem } from '../EventListItem';
import { testIds } from '../../testIds';
import type { Event } from '../../api/types';

const baseEvent: Event = {
  id: 'evt_test',
  title: 'A Test Show',
  artist: 'Test Artist',
  genre: 'Indie Rock',
  startsAt: '2026-06-12T20:00:00.000Z',
  doorsAt: '2026-06-12T19:00:00.000Z',
  venue: {
    id: 'ven_test',
    name: 'Test Venue',
    city: 'Brooklyn, NY',
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

describe('<EventListItem />', () => {
  it('renders title, artist, and price', () => {
    const { getByText } = render(<EventListItem event={baseEvent} onPress={() => undefined} />);
    expect(getByText('A Test Show')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
    expect(getByText('$45.00')).toBeTruthy();
  });

  it('shows the SOLD OUT chip and hides price when soldOut', () => {
    const { getByText, queryByText } = render(
      <EventListItem event={{ ...baseEvent, soldOut: true }} onPress={() => undefined} />,
    );
    expect(getByText('Sold out')).toBeTruthy();
    expect(queryByText('$45.00')).toBeNull();
  });

  it('fires onPress with the event when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<EventListItem event={baseEvent} onPress={onPress} />);
    fireEvent.press(getByTestId(testIds.events.item('evt_test')));
    expect(onPress).toHaveBeenCalledWith(baseEvent);
  });
});
