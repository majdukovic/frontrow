import { useMutation, useQueryClient } from '@tanstack/react-query';

import { login, logout } from '../api/services/auth';
import { useAuthStore } from '../state/auth';
import { track } from '../state/analytics';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      track('auth.login.attempt', { email: input.email });
      const res = await login(input);
      await setSession(res.token, res.user);
      return res;
    },
    onSuccess: (res) => {
      track('auth.login.success', { userId: res.user.id });
      void qc.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err) => {
      track('auth.login.failure', { message: (err as Error).message });
    },
  });
}

export function useLogout() {
  const token = useAuthStore((s) => s.token);
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      track('auth.logout');
      try {
        await logout(token);
      } catch {
        // best-effort; logout always clears local session
      }
      await clear();
    },
    onSuccess: () => {
      qc.clear();
    },
  });
}
