import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  listPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  type AddPaymentMethodInput,
} from '../api/services/paymentMethods';
import { useAuthStore } from '../state/auth';
import { track } from '../state/analytics';

const BASE_KEY = ['paymentMethods'] as const;

export function usePaymentMethods() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [...BASE_KEY, token],
    queryFn: () => listPaymentMethods(token),
    enabled: Boolean(token),
  });
}

export function useAddPaymentMethod() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPaymentMethodInput) => {
      track('paymentMethod.add.intent', { brand: input.number.startsWith('4') ? 'visa' : 'other' });
      return addPaymentMethod(token, input);
    },
    onSuccess: (pm) => {
      track('paymentMethod.add.success', { id: pm.id });
      void qc.invalidateQueries({ queryKey: BASE_KEY });
    },
    onError: (err) => track('paymentMethod.add.failure', { message: (err as Error).message }),
  });
}

export function useDeletePaymentMethod() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(token, id),
    onSuccess: (_, id) => {
      track('paymentMethod.delete.success', { id });
      void qc.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useSetDefaultPaymentMethod() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultPaymentMethod(token, id),
    onSuccess: (_, id) => {
      track('paymentMethod.setDefault.success', { id });
      void qc.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}
