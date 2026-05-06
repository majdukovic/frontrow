import { useQaStore } from '../state/qa';

import type { ApiError } from './types';
import type { FailureTrigger } from '../state/qa';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, body: ApiError) {
    super(body.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.code;
  }
}

export async function applyQaDelay(): Promise<void> {
  const ms = useQaStore.getState().networkDelayMs;
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}

export function applyQaTriggerError(kind: FailureTrigger): void {
  const triggers = useQaStore.getState().triggers;
  if (!triggers[kind]) return;
  if (kind === 'sessionExpired') {
    throw new ApiClientError(401, {
      code: 'session_expired',
      message: 'Your session expired. Sign in again.',
    });
  }
  if (kind === 'paymentTimeout') {
    throw new ApiClientError(504, {
      code: 'payment_timeout',
      message: 'Payment processor timed out. Please try again.',
    });
  }
  if (kind === 'reviewSubmit') {
    throw new ApiClientError(503, {
      code: 'service_unavailable',
      message: 'Reviews service is temporarily unavailable.',
    });
  }
  if (kind === 'imageUpload') {
    throw new ApiClientError(413, {
      code: 'upload_failed',
      message: 'Image upload failed.',
    });
  }
}

export function applyQaForcedError(): void {
  // Session-expired trigger short-circuits everything — it must run before
  // the route-specific checks so a stale-token reproducer fails uniformly.
  applyQaTriggerError('sessionExpired');
  const mode = useQaStore.getState().forceError;
  if (mode === 'none') return;
  if (mode === '4xx') {
    throw new ApiClientError(400, {
      code: 'forced_4xx',
      message: 'Forced 4xx error from QA menu.',
    });
  }
  if (mode === '5xx') {
    throw new ApiClientError(500, {
      code: 'forced_5xx',
      message: 'Forced 5xx error from QA menu.',
    });
  }
  if (mode === 'timeout') {
    throw new ApiClientError(408, {
      code: 'forced_timeout',
      message: 'Forced timeout from QA menu.',
    });
  }
  if (mode === 'offline') {
    throw new ApiClientError(0, {
      code: 'offline',
      message: 'No internet connection.',
    });
  }
}
