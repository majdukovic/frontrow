import {
  listPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../paymentMethods';
import { login } from '../auth';
import { resetMockState, mockState } from '../../../mocks/state';

async function signIn(): Promise<string> {
  const { token } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
  return token;
}

beforeEach(() => {
  resetMockState();
  mockState.sessions.clear();
});

describe('paymentMethods.add', () => {
  it('accepts a Luhn-valid card', async () => {
    const token = await signIn();
    const pm = await addPaymentMethod(token, {
      cardholder: 'Test User',
      number: '4111111111111111',
      expMonth: 12,
      expYear: 2030,
      cvc: '123',
    });
    expect(pm.brand).toBe('visa');
    expect(pm.last4).toBe('1111');
    expect(pm.isDefault).toBe(false); // there's already a default seeded card
  });

  it('rejects a Luhn-invalid number', async () => {
    const token = await signIn();
    await expect(
      addPaymentMethod(token, {
        cardholder: 'X',
        number: '1234567890123456',
        expMonth: 12,
        expYear: 2030,
        cvc: '123',
      }),
    ).rejects.toMatchObject({ code: 'invalid_number' });
  });

  it('rejects the always-decline test card', async () => {
    const token = await signIn();
    await expect(
      addPaymentMethod(token, {
        cardholder: 'X',
        number: '4000000000000002',
        expMonth: 12,
        expYear: 2030,
        cvc: '123',
      }),
    ).rejects.toMatchObject({ status: 402, code: 'card_declined' });
  });

  it('rejects expired cards', async () => {
    const token = await signIn();
    await expect(
      addPaymentMethod(token, {
        cardholder: 'X',
        number: '4111111111111111',
        expMonth: 1,
        expYear: 2000,
        cvc: '123',
      }),
    ).rejects.toMatchObject({ code: 'card_expired' });
  });

  it('rejects bad CVC length', async () => {
    const token = await signIn();
    await expect(
      addPaymentMethod(token, {
        cardholder: 'X',
        number: '4111111111111111',
        expMonth: 12,
        expYear: 2030,
        cvc: '12',
      }),
    ).rejects.toMatchObject({ code: 'invalid_cvc' });
  });

  it('first card auto-becomes default', async () => {
    const token = await signIn();
    // wipe default seed
    mockState.paymentMethods = [];
    const pm = await addPaymentMethod(token, {
      cardholder: 'X',
      number: '4111111111111111',
      expMonth: 12,
      expYear: 2030,
      cvc: '123',
    });
    expect(pm.isDefault).toBe(true);
  });
});

describe('paymentMethods.delete + setDefault', () => {
  it('promotes another card to default when the default is deleted', async () => {
    const token = await signIn();
    const second = await addPaymentMethod(token, {
      cardholder: 'X',
      number: '4111111111111111',
      expMonth: 12,
      expYear: 2030,
      cvc: '123',
    });
    await deletePaymentMethod(token, 'pm_001');
    const all = await listPaymentMethods(token);
    expect(all.find((p) => p.id === second.id)?.isDefault).toBe(true);
  });

  it('setDefault flips exactly one card', async () => {
    const token = await signIn();
    const second = await addPaymentMethod(token, {
      cardholder: 'X',
      number: '4111111111111111',
      expMonth: 12,
      expYear: 2030,
      cvc: '123',
    });
    await setDefaultPaymentMethod(token, second.id);
    const all = await listPaymentMethods(token);
    expect(all.filter((p) => p.isDefault)).toHaveLength(1);
    expect(all.find((p) => p.id === second.id)?.isDefault).toBe(true);
  });
});
