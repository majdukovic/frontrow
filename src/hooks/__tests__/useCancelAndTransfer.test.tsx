import { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useCancelTicket,
  useTransferTicket,
  useMyTickets,
} from '../useTickets';
import { login } from '../../api/services/auth';
import { useAuthStore } from '../../state/auth';
import { useQaStore } from '../../state/qa';
import { resetMockState, mockState } from '../../mocks/state';

/**
 * Cancel and transfer are the two ticket-mutation hooks (apart from
 * purchase) that flows depend on. Both invalidate the tickets cache on
 * success — this test pins that behavior so the list refetch chain
 * stays intact when the surface changes.
 *
 * For transfer, we also pin the recipient-not-found error path —
 * that's the case the transfer Maestro flow exercises.
 */

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
  const { token, user } = await login({
    email: 'demo@frontrow.app',
    password: 'demo1234',
  });
  useAuthStore.setState({ token, user, hydrated: true });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
});

describe('useCancelTicket', () => {
  it('flips the ticket status to refund_pending and invalidates the list cache', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => ({ cancel: useCancelTicket(), list: useMyTickets() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());

    const target = result.current.list.data!.find((t) => t.status === 'active');
    expect(target).toBeDefined();

    await act(async () => {
      await result.current.cancel.mutateAsync(target!.id);
    });

    await waitFor(() => {
      const updated = result.current.list.data?.find((t) => t.id === target!.id);
      expect(updated?.status).toBe('refund_pending');
    });
  });

  it('rejects when called against a ticket the user does not own', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCancelTicket(), { wrapper });
    await expect(
      act(() => result.current.mutateAsync('tkt_does_not_exist')),
    ).rejects.toBeDefined();
  });
});

describe('useTransferTicket', () => {
  it('rejects with recipient_not_found when the email is unknown', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => ({ list: useMyTickets(), transfer: useTransferTicket() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());
    const tk = result.current.list.data!.find((t) => t.status === 'active')!;
    await expect(
      act(() =>
        result.current.transfer.mutateAsync({
          ticketId: tk.id,
          recipientEmail: 'nobody@example.com',
        }),
      ),
    ).rejects.toMatchObject({ code: 'recipient_not_found' });
  });

  it('reassigns the ticket to the recipient on success', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => ({ list: useMyTickets(), transfer: useTransferTicket() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());
    const tk = result.current.list.data!.find((t) => t.status === 'active')!;
    await act(async () => {
      // friend@frontrow.app is the seed friend account.
      await result.current.transfer.mutateAsync({
        ticketId: tk.id,
        recipientEmail: 'friend@frontrow.app',
      });
    });
    // After transfer, the ticket no longer belongs to the demo user's list.
    await waitFor(() => {
      const stillMine = result.current.list.data?.some((t) => t.id === tk.id);
      expect(stillMine).toBe(false);
    });
  });
});
