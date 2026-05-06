import { useQaStore } from '../state/qa';

import type { ApiError } from './types';

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

export function applyQaForcedError(): void {
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
