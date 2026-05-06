import { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useUnreadNotificationCount,
  useMarkAllNotificationsRead,
} from '../useNotifications';
import { login } from '../../api/services/auth';
import { useAuthStore } from '../../state/auth';
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
  const { token, user } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
  useAuthStore.setState({ token, user, hydrated: true });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null });
});

describe('useUnreadNotificationCount', () => {
  it('reflects the seeded unread count and drops to zero after mark-all-read', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => ({ count: useUnreadNotificationCount(), mark: useMarkAllNotificationsRead() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.count).toBe(2));
    await act(async () => {
      await result.current.mark.mutateAsync();
    });
    await waitFor(() => expect(result.current.count).toBe(0), { timeout: 3000 });
  });
});
