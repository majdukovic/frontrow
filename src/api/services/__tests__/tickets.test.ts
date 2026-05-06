import {
  purchaseTicket,
  cancelTicket,
  transferTicket,
  applyPromoCode,
  getTicket,
} from '../tickets';
import { login } from '../auth';
import { resetMockState, mockState } from '../../../mocks/state';

async function signIn(email = 'demo@frontrow.app', password = 'demo1234'): Promise<string> {
  const { token } = await login({ email, password });
  return token;
}

beforeEach(() => {
  resetMockState();
  mockState.sessions.clear();
});

describe('tickets.purchaseTicket', () => {
  it('issues a ticket for a valid signed-in purchase', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, { eventId: 'evt_001', quantity: 2 });
    expect(ticket.userId).toBe('usr_demo');
    expect(ticket.quantity).toBe(2);
    expect(ticket.status).toBe('active');
    expect(ticket.totalCents).toBe(45_00 * 2);
    expect(ticket.qrPayload).toMatch(/^FR-tkt_\d+-evt_001-2$/);
  });

  it('rejects unauthenticated purchases', async () => {
    await expect(purchaseTicket(null, { eventId: 'evt_001', quantity: 1 })).rejects.toMatchObject({
      status: 401,
    });
  });

  it('refuses sold-out events', async () => {
    const token = await signIn();
    await expect(
      purchaseTicket(token, { eventId: 'evt_003', quantity: 1 }),
    ).rejects.toMatchObject({ status: 409, code: 'sold_out' });
  });

  it('uses the selected tier price when tiers exist', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, {
      eventId: 'evt_001',
      quantity: 1,
      tierId: 'vip',
    });
    expect(ticket.tier).toBe('VIP + Meet & Greet');
    expect(ticket.totalCents).toBe(145_00);
  });

  it('refuses sold-out tiers', async () => {
    const token = await signIn();
    await expect(
      purchaseTicket(token, { eventId: 'evt_002', quantity: 1, tierId: 'box' }),
    ).rejects.toMatchObject({ status: 409, code: 'tier_sold_out' });
  });

  it('falls back to the first tier when tierId is missing', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, { eventId: 'evt_001', quantity: 1 });
    expect(ticket.tier).toBe('General Admission');
  });
});

describe('tickets.cancelTicket', () => {
  it('moves an active ticket to refund_pending', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, { eventId: 'evt_001', quantity: 1 });
    const cancelled = await cancelTicket(token, ticket.id);
    expect(cancelled.status).toBe('refund_pending');
  });

  it('refuses to cancel a ticket that is already cancelled', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, { eventId: 'evt_001', quantity: 1 });
    await cancelTicket(token, ticket.id);
    await expect(cancelTicket(token, ticket.id)).rejects.toMatchObject({
      status: 409,
      code: 'invalid_state',
    });
  });

  it('refuses to cancel another user’s ticket', async () => {
    const otherToken = await signIn('friend@frontrow.app', 'friend1234');
    await expect(cancelTicket(otherToken, 'tkt_001')).rejects.toMatchObject({ status: 404 });
  });
});

describe('tickets.transferTicket', () => {
  it('reassigns ownership when the recipient exists', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, { eventId: 'evt_001', quantity: 1 });
    const transferred = await transferTicket(token, ticket.id, 'friend@frontrow.app');
    expect(transferred.userId).toBe('usr_friend');
  });

  it('rejects malformed emails', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, { eventId: 'evt_001', quantity: 1 });
    await expect(transferTicket(token, ticket.id, 'not-an-email')).rejects.toMatchObject({
      code: 'invalid_email',
    });
  });

  it('rejects unknown recipient emails', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, { eventId: 'evt_001', quantity: 1 });
    await expect(transferTicket(token, ticket.id, 'nobody@example.com')).rejects.toMatchObject({
      code: 'recipient_not_found',
    });
  });

  it('refuses self-transfer', async () => {
    const token = await signIn();
    const ticket = await purchaseTicket(token, { eventId: 'evt_001', quantity: 1 });
    await expect(transferTicket(token, ticket.id, 'demo@frontrow.app')).rejects.toMatchObject({
      code: 'self_transfer',
    });
  });
});

describe('tickets.applyPromoCode', () => {
  it.each([
    ['FRONTROW10', 10],
    ['FRONTROW25', 25],
    ['FRONTROW50', 50],
    ['FREE', 100],
  ])('accepts %s as %d% off', async (code, percent) => {
    const result = await applyPromoCode({ eventId: 'evt_001', code });
    expect(result.percentOff).toBe(percent);
    expect(result.discountCents).toBe(Math.round((45_00 * percent) / 100));
  });

  it('returns 410 for expired codes', async () => {
    await expect(applyPromoCode({ eventId: 'evt_001', code: 'EXPIRED' })).rejects.toMatchObject({
      status: 410,
      code: 'expired_promo',
    });
  });

  it('returns 404 for invalid codes', async () => {
    await expect(applyPromoCode({ eventId: 'evt_001', code: 'NOPE' })).rejects.toMatchObject({
      status: 404,
      code: 'invalid_promo',
    });
  });
});

describe('tickets.getTicket', () => {
  it('returns the user’s ticket', async () => {
    const token = await signIn();
    const ticket = await getTicket(token, 'tkt_001');
    expect(ticket.id).toBe('tkt_001');
  });

  it('hides tickets owned by other users', async () => {
    const otherToken = await signIn('friend@frontrow.app', 'friend1234');
    await expect(getTicket(otherToken, 'tkt_001')).rejects.toMatchObject({ status: 404 });
  });
});
