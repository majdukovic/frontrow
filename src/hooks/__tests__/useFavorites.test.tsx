import { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useFavoriteEventIds,
  useToggleFavorite,
} from '../useFavorites';
import { login } from '../../api/services/auth';
import { useAuthStore } from '../../state/auth';
import { resetMockState, mockState } from '../../mocks/state';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(async () => {
  resetMockState();
  mockState.sessions.clear();
  // Set up a signed-in session in the auth store directly so the
  // hooks have a token to read.
  const { token, user } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
  useAuthStore.setState({ token, user, hydrated: true });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
});

describe('useFavoriteEventIds + useToggleFavorite', () => {
  it('reads the seeded favorites and reflects a toggle', async () => {
    const { result } = renderHook(() => ({
      list: useFavoriteEventIds(),
      toggle: useToggleFavorite(),
    }), { wrapper });

    await waitFor(() => expect(result.current.list.data).toBeDefined());
    expect(result.current.list.data?.sort()).toEqual(['evt_001', 'evt_002', 'evt_003']);

    await act(async () => {
      await result.current.toggle.mutateAsync({ eventId: 'evt_004', favorite: true });
    });
    await waitFor(() => expect(result.current.list.data).toContain('evt_004'));

    await act(async () => {
      await result.current.toggle.mutateAsync({ eventId: 'evt_001', favorite: false });
    });
    await waitFor(() => expect(result.current.list.data).not.toContain('evt_001'));
  });
});
