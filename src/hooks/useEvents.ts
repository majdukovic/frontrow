import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { listEvents, getEvent, type EventFilters } from '../api/services/events';

export function useEvents(filters: EventFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['events', filters],
    queryFn: ({ pageParam = 0 }) => listEvents(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => getEvent(id),
    enabled: Boolean(id),
  });
}
