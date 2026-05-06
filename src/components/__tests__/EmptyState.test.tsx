import { render } from '@testing-library/react-native';

import { EmptyState } from '../EmptyState';

describe('<EmptyState />', () => {
  it('renders icon + title; body is optional', () => {
    const { getByText, queryByText, rerender } = render(
      <EmptyState icon="ticket-outline" title="No tickets" testID="empty.test" />,
    );
    expect(getByText('No tickets')).toBeTruthy();
    expect(queryByText('subtitle')).toBeNull();

    rerender(
      <EmptyState
        icon="ticket-outline"
        title="No tickets"
        body="Buy your first ticket from the events list."
        testID="empty.test"
      />,
    );
    expect(getByText('Buy your first ticket from the events list.')).toBeTruthy();
  });

  it('marks the title as a header for screen readers', () => {
    const { getByRole } = render(
      <EmptyState icon="ticket-outline" title="No tickets" testID="empty.test" />,
    );
    expect(getByRole('header')).toBeTruthy();
  });
});
