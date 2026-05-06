import { applyQaDelay, applyQaForcedError, ApiClientError } from '../client';
import { mockState } from '../../mocks/state';
import type { Artist } from '../types';

function requireUser(token: string | null): string {
  if (!token) {
    throw new ApiClientError(401, { code: 'unauthorized', message: 'Sign in required.' });
  }
  const userId = mockState.sessions.get(token);
  if (!userId) {
    throw new ApiClientError(401, { code: 'unauthorized', message: 'Session expired.' });
  }
  return userId;
}

function bucket(userId: string): Set<string> {
  let s = mockState.follows.get(userId);
  if (!s) {
    s = new Set();
    mockState.follows.set(userId, s);
  }
  return s;
}

export async function listArtists(): Promise<Artist[]> {
  await applyQaDelay();
  applyQaForcedError();
  return [...mockState.artists];
}

export async function getArtistByName(name: string): Promise<Artist | null> {
  await applyQaDelay();
  applyQaForcedError();
  const lc = name.toLowerCase();
  return mockState.artists.find((a) => a.name.toLowerCase() === lc) ?? null;
}

export async function listFollowedArtists(token: string | null): Promise<Artist[]> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const ids = bucket(userId);
  return mockState.artists.filter((a) => ids.has(a.id));
}

export async function followArtist(token: string | null, artistId: string): Promise<void> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  if (!mockState.artists.some((a) => a.id === artistId)) {
    throw new ApiClientError(404, { code: 'not_found', message: 'Artist not found.' });
  }
  bucket(userId).add(artistId);
}

export async function unfollowArtist(token: string | null, artistId: string): Promise<void> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  bucket(userId).delete(artistId);
}
