import { browser } from '@wdio/globals';

import { waitForId, tapId, typeIntoId } from './helpers';

describe('Login', () => {
  it('signs in with the demo account', async () => {
    await waitForId('screen.events');

    // Profile tab uses the visible label, not a testID.
    await browser.$('~Profile').click();

    await tapId('profile.signInButton');
    await typeIntoId('login.emailInput', 'demo@frontrow.app');
    await typeIntoId('login.passwordInput', 'demo1234');
    await tapId('profile.signInButton');

    await waitForId('profile.signOutButton');
  });
});
