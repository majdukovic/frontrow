import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listReviewsForEvent, postReview } from '../api/services/reviews';
import { useAuthStore } from '../state/auth';
import { track } from '../state/analytics';

export function useReviewsForEvent(eventId: string) {
  return useQuery({
    queryKey: ['reviews', eventId],
    queryFn: () => listReviewsForEvent(eventId),
    enabled: Boolean(eventId),
  });
}

export function usePostReview(eventId: string) {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { rating: 1 | 2 | 3 | 4 | 5; text: string }) => {
      track('review.post.attempt', { eventId, rating: input.rating });
      return postReview(token, { eventId, ...input });
    },
    onSuccess: (review) => {
      track('review.post.success', { reviewId: review.id });
      void qc.invalidateQueries({ queryKey: ['reviews', eventId] });
    },
    onError: (err) => track('review.post.failure', { message: (err as Error).message }),
  });
}
