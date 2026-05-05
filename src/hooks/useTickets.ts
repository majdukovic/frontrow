import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listMyTickets, purchaseTicket, cancelTicket } from '../api/services/tickets';
import { useAuthStore } from '../state/auth';
import { track } from '../state/analytics';

export function useMyTickets() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['tickets', 'mine', token],
    queryFn: () => listMyTickets(token),
    enabled: Boolean(token),
  });
}

export function usePurchaseTicket() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { eventId: string; quantity: number; tier?: string }) => {
      track('ticket.purchase.intent', input);
      return purchaseTicket(token, input);
    },
    onSuccess: (ticket) => {
      track('ticket.purchase.success', { ticketId: ticket.id, eventId: ticket.eventId });
      void qc.invalidateQueries({ queryKey: ['tickets', 'mine'] });
    },
    onError: (err) => {
      track('ticket.purchase.failure', { message: (err as Error).message });
    },
  });
}

export function useCancelTicket() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      track('ticket.cancel.intent', { ticketId: id });
      return cancelTicket(token, id);
    },
    onSuccess: (ticket) => {
      track('ticket.cancel.success', { ticketId: ticket.id });
      void qc.invalidateQueries({ queryKey: ['tickets', 'mine'] });
    },
  });
}
