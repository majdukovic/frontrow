import { useQaStore } from '../state/qa';
import type { CurrencyCode } from '../api/types';

const symbols: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export function formatPrice(cents: number, currency: CurrencyCode): string {
  const fractional = currency === 'JPY' ? 0 : 2;
  const value = currency === 'JPY' ? cents : cents / 100;
  const formatted = value.toFixed(fractional);
  return `${symbols[currency]}${formatted}`;
}

export function formatEventDate(iso: string): string {
  const locale = useQaStore.getState().locale ?? undefined;
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function formatDateShort(iso: string): string {
  const locale = useQaStore.getState().locale ?? undefined;
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatTimeShort(iso: string): string {
  const locale = useQaStore.getState().locale ?? undefined;
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}
