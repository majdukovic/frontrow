import { listFavoriteEventIds, addFavorite, removeFavorite } from '../favorites';
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

describe('favorites', () => {
  it('returns the seeded favorites for demo user', async () => {
    const token = await signIn();
    const ids = await listFavoriteEventIds(token);
    expect(ids.sort()).toEqual(['evt_001', 'evt_002', 'evt_003']);
  });

  it('add is idempotent', async () => {
    const token = await signIn();
    await addFavorite(token, 'evt_004');
    await addFavorite(token, 'evt_004');
    const ids = await listFavoriteEventIds(token);
    expect(ids.filter((id) => id === 'evt_004')).toHaveLength(1);
  });

  it('remove cleans an entry', async () => {
    const token = await signIn();
    await removeFavorite(token, 'evt_001');
    const ids = await listFavoriteEventIds(token);
    expect(ids).not.toContain('evt_001');
  });

  it('rejects favoriting unknown events', async () => {
    const token = await signIn();
    await expect(addFavorite(token, 'evt_nope')).rejects.toMatchObject({ status: 404 });
  });

  it('requires sign-in', async () => {
    await expect(listFavoriteEventIds(null)).rejects.toMatchObject({ status: 401 });
  });
});
