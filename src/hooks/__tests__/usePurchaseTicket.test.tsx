import { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { usePurchaseTicket, useMyTickets } from '../useTickets';
import { login } from '../../api/services/auth';
import { useAuthStore } from '../../state/auth';
import { useQaStore } from '../../state/qa';
import { resetMockState, mockState } from '../../mocks/state';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

beforeEach(async () => {
  resetMockState();
  mockState.sessions.clear();
  useQaStore.getState().clearTriggers();
  const { token, user } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
  useAuthStore.setState({ token, user, hydrated: true });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
});

describe('usePurchaseTicket', () => {
  it('appends a new ticket to the list after a successful purchase', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => ({ buy: usePurchaseTicket(), list: useMyTickets() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());
    const before = result.current.list.data?.length ?? 0;
    await act(async () => {
      await result.current.buy.mutateAsync({ eventId: 'evt_001', quantity: 1 });
    });
    await waitFor(() => expect((result.current.list.data?.length ?? 0) > before).toBe(true));
  });

  it('surfaces paymentTimeout when the QA trigger is on', async () => {
    useQaStore.getState().setTrigger('paymentTimeout', true);
    const wrapper = makeWrapper();
    const { result } = renderHook(() => usePurchaseTicket(), { wrapper });
    await expect(
      act(() => result.current.mutateAsync({ eventId: 'evt_001', quantity: 1 })),
    ).rejects.toMatchObject({ code: 'payment_timeout' });
  });
});
