import { applyQaDelay, applyQaForcedError, ApiClientError } from '../client';
import { mockState } from '../../mocks/state';
import { now } from '../../state/qa';
import type { Ticket } from '../types';

let ticketCounter = 100;
function nextTicketId(): string {
  ticketCounter += 1;
  return `tkt_${ticketCounter.toString().padStart(3, '0')}`;
}

function requireUser(token: string | null): string {
  if (!token) {
    throw new ApiClientError(401, { code: 'unauthorized', message: 'Sign in required.' });
  }
  const userId = mockState.sessions.get(token);
  if (!userId) {
    throw new ApiClientError(401, { code: 'unauthorized', message: 'Session expired.' });
  }
  return userId;
}

export async function listMyTickets(token: string | null): Promise<Ticket[]> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  return mockState.tickets.filter((t) => t.userId === userId);
}

export async function purchaseTicket(
  token: string | null,
  input: { eventId: string; quantity: number; tier?: string },
): Promise<Ticket> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const event = mockState.events.find((e) => e.id === input.eventId);
  if (!event) {
    throw new ApiClientError(404, { code: 'not_found', message: 'Event not found.' });
  }
  if (event.soldOut) {
    throw new ApiClientError(409, { code: 'sold_out', message: 'This event is sold out.' });
  }
  const id = nextTicketId();
  const ticket: Ticket = {
    id,
    userId,
    eventId: event.id,
    quantity: input.quantity,
    tier: input.tier ?? 'General Admission',
    purchasedAt: now().toISOString(),
    totalCents: event.priceCents * input.quantity,
    currency: event.currency,
    status: 'active',
    qrPayload: `FR-${id}-${event.id}-${input.quantity}`,
  };
  mockState.tickets.push(ticket);
  return ticket;
}

export type PromoCodeResult = {
  code: string;
  discountCents: number;
  percentOff: number;
};

export async function applyPromoCode(input: {
  eventId: string;
  code: string;
}): Promise<PromoCodeResult> {
  await applyQaDelay();
  applyQaForcedError();
  const code = input.code.trim().toUpperCase();
  const event = mockState.events.find((e) => e.id === input.eventId);
  if (!event) {
    throw new ApiClientError(404, { code: 'not_found', message: 'Event not found.' });
  }
  const codeMap: Record<string, number> = {
    FRONTROW10: 10,
    FRONTROW25: 25,
    FRONTROW50: 50,
    FREE: 100,
  };
  if (code === 'EXPIRED') {
    throw new ApiClientError(410, {
      code: 'expired_promo',
      message: 'This promo code has expired.',
    });
  }
  const percentOff = codeMap[code];
  if (percentOff == null) {
    throw new ApiClientError(404, {
      code: 'invalid_promo',
      message: 'Promo code is invalid.',
    });
  }
  return {
    code,
    percentOff,
    discountCents: Math.round((event.priceCents * percentOff) / 100),
  };
}

export async function cancelTicket(token: string | null, ticketId: string): Promise<Ticket> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const ticket = mockState.tickets.find((t) => t.id === ticketId && t.userId === userId);
  if (!ticket) {
    throw new ApiClientError(404, { code: 'not_found', message: 'Ticket not found.' });
  }
  if (ticket.status !== 'active') {
    throw new ApiClientError(409, {
      code: 'invalid_state',
      message: 'Only active tickets can be cancelled.',
    });
  }
  ticket.status = 'refund_pending';
  return ticket;
}
