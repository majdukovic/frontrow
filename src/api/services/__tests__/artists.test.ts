import {
  listArtists,
  getArtistByName,
  listFollowedArtists,
  followArtist,
  unfollowArtist,
} from '../artists';
import { login } from '../auth';
import { resetMockState, mockState } from '../../../mocks/state';

async function signIn(): Promise<string> {
  const { token } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
  return token;
}

beforeEach(() => {
  resetMockState();
  mockState.sessions.clear();
});

describe('artists', () => {
  it('listArtists returns seeded entries', async () => {
    const all = await listArtists();
    expect(all.length).toBeGreaterThan(0);
    expect(all.find((a) => a.name === 'Midnight Howl')).toBeTruthy();
  });

  it('getArtistByName matches case-insensitively', async () => {
    const a = await getArtistByName('midnight howl');
    expect(a?.id).toBe('art_midnight_howl');
  });

  it('returns null for unknown artist', async () => {
    expect(await getArtistByName('nope')).toBeNull();
  });

  it('follow / unfollow round-trips', async () => {
    const token = await signIn();
    expect(await listFollowedArtists(token)).toHaveLength(0);
    await followArtist(token, 'art_midnight_howl');
    let followed = await listFollowedArtists(token);
    expect(followed).toHaveLength(1);
    await unfollowArtist(token, 'art_midnight_howl');
    followed = await listFollowedArtists(token);
    expect(followed).toHaveLength(0);
  });

  it('rejects following an unknown artist', async () => {
    const token = await signIn();
    await expect(followArtist(token, 'art_nope')).rejects.toMatchObject({ status: 404 });
  });
});
