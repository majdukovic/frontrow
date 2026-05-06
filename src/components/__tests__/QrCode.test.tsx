import { render } from '@testing-library/react-native';

import { QrCode } from '../QrCode';

describe('<QrCode />', () => {
  it('renders with the supplied testID and is accessible by label', () => {
    const { getByTestId, getByLabelText } = render(
      <QrCode payload="FR-tkt_001-evt_001-1" testID="qr.test" />,
    );
    expect(getByTestId('qr.test')).toBeTruthy();
    expect(getByLabelText(/QR code for FR-tkt_001/)).toBeTruthy();
  });

  it('produces deterministic markup for the same payload', () => {
    const a = render(<QrCode payload="FR-X" testID="a" />).toJSON();
    const b = render(<QrCode payload="FR-X" testID="b" />).toJSON();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b).replace(/"b"/g, '"a"'));
  });
});
