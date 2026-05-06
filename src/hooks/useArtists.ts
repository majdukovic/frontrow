import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  listArtists,
  getArtistByName,
  listFollowedArtists,
  followArtist,
  unfollowArtist,
} from '../api/services/artists';
import { useAuthStore } from '../state/auth';
import { track } from '../state/analytics';

const ARTISTS_KEY = ['artists'] as const;
const FOLLOWED_KEY = ['artists', 'followed'] as const;

export function useArtists() {
  return useQuery({
    queryKey: ARTISTS_KEY,
    queryFn: () => listArtists(),
  });
}

export function useArtistByName(name: string | undefined) {
  return useQuery({
    queryKey: ['artists', 'byName', name],
    queryFn: () => getArtistByName(name ?? ''),
    enabled: Boolean(name),
  });
}

export function useFollowedArtists() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [...FOLLOWED_KEY, token],
    queryFn: () => listFollowedArtists(token),
    enabled: Boolean(token),
  });
}

export function useToggleFollowArtist() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { artistId: string; follow: boolean }) => {
      track('artist.follow.toggle', input);
      if (input.follow) await followArtist(token, input.artistId);
      else await unfollowArtist(token, input.artistId);
      return input;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FOLLOWED_KEY });
    },
  });
}
