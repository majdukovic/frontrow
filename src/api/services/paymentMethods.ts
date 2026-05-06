import { applyQaDelay, applyQaForcedError, ApiClientError } from '../client';
import { mockState } from '../../mocks/state';
import { now } from '../../state/qa';
import type { CardBrand, PaymentMethod } from '../types';

let pmCounter = 100;
function nextId(): string {
  pmCounter += 1;
  return `pm_${pmCounter.toString().padStart(3, '0')}`;
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

function detectBrand(number: string): CardBrand {
  const n = number.replace(/\s+/g, '');
  if (/^4\d{12,18}$/.test(n)) return 'visa';
  if (/^(5[1-5]\d{14}|2[2-7]\d{14})$/.test(n)) return 'mastercard';
  if (/^3[47]\d{13}$/.test(n)) return 'amex';
  if (/^6(?:011|5\d{2})\d{12}$/.test(n)) return 'discover';
  return 'unknown';
}

function luhn(number: string): boolean {
  const n = number.replace(/\s+/g, '');
  if (!/^\d{12,19}$/.test(n)) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i -= 1) {
    let d = Number(n[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export async function listPaymentMethods(token: string | null): Promise<PaymentMethod[]> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  return mockState.paymentMethods.filter((p) => p.userId === userId);
}

export type AddPaymentMethodInput = {
  cardholder: string;
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
};

export async function addPaymentMethod(
  token: string | null,
  input: AddPaymentMethodInput,
): Promise<PaymentMethod> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const cardholder = input.cardholder.trim();
  const number = input.number.replace(/\s+/g, '');
  if (!cardholder) {
    throw new ApiClientError(400, { code: 'invalid_cardholder', message: 'Cardholder required.' });
  }
  if (!luhn(number)) {
    throw new ApiClientError(400, { code: 'invalid_number', message: 'Card number is invalid.' });
  }
  // Test card that always declines.
  if (number === '4000000000000002') {
    throw new ApiClientError(402, { code: 'card_declined', message: 'Your card was declined.' });
  }
  if (input.expMonth < 1 || input.expMonth > 12) {
    throw new ApiClientError(400, {
      code: 'invalid_exp',
      message: 'Expiration month must be 1–12.',
    });
  }
  const today = now();
  const lastDay = new Date(input.expYear, input.expMonth, 0);
  if (lastDay.getTime() < today.getTime()) {
    throw new ApiClientError(400, { code: 'card_expired', message: 'Card has expired.' });
  }
  if (!/^\d{3,4}$/.test(input.cvc)) {
    throw new ApiClientError(400, { code: 'invalid_cvc', message: 'CVC must be 3 or 4 digits.' });
  }

  const isFirst = mockState.paymentMethods.filter((p) => p.userId === userId).length === 0;
  const card: PaymentMethod = {
    id: nextId(),
    userId,
    brand: detectBrand(number),
    last4: number.slice(-4),
    expMonth: input.expMonth,
    expYear: input.expYear,
    cardholder,
    isDefault: isFirst,
    createdAt: now().toISOString(),
  };
  mockState.paymentMethods.push(card);
  return card;
}

export async function deletePaymentMethod(token: string | null, id: string): Promise<void> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const idx = mockState.paymentMethods.findIndex((p) => p.id === id && p.userId === userId);
  if (idx === -1) {
    throw new ApiClientError(404, { code: 'not_found', message: 'Payment method not found.' });
  }
  const wasDefault = mockState.paymentMethods[idx]!.isDefault;
  mockState.paymentMethods.splice(idx, 1);
  if (wasDefault) {
    const next = mockState.paymentMethods.find((p) => p.userId === userId);
    if (next) next.isDefault = true;
  }
}

export async function setDefaultPaymentMethod(
  token: string | null,
  id: string,
): Promise<PaymentMethod> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const target = mockState.paymentMethods.find((p) => p.id === id && p.userId === userId);
  if (!target) {
    throw new ApiClientError(404, { code: 'not_found', message: 'Payment method not found.' });
  }
  for (const p of mockState.paymentMethods) {
    if (p.userId === userId) p.isDefault = p.id === id;
  }
  return target;
}
