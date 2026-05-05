import { waitForId } from './helpers';

describe('Smoke', () => {
  it('launches and shows the Events tab', async () => {
    await waitForId('screen.events');
  });
});
