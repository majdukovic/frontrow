import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { SwipeableRow } from '../SwipeableRow';

/**
 * Coverage focus: the action button below the swipe layer is reachable
 * via its testID so test harnesses can assert the cancel handler runs.
 * We don't simulate the gesture itself in jest — that lives at the
 * Maestro / Detox layer, which actually drives the touch system.
 */
describe('SwipeableRow', () => {
  it('fires onAction when the action button is pressed', () => {
    const onAction = jest.fn();
    const { getByTestId } = render(
      <SwipeableRow actionLabel="Cancel" actionTestID="row.cancel" onAction={onAction}>
        <Text>row</Text>
      </SwipeableRow>,
    );
    fireEvent.press(getByTestId('row.cancel'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('exposes the action label to a11y readers', () => {
    const { getByLabelText } = render(
      <SwipeableRow actionLabel="Cancel" onAction={() => undefined}>
        <Text>row</Text>
      </SwipeableRow>,
    );
    expect(getByLabelText('Cancel')).toBeTruthy();
  });
});
