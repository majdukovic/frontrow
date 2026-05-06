import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../notifications';
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

describe('notifications', () => {
  it('lists in reverse-chronological order', async () => {
    const token = await signIn();
    const all = await listNotifications(token);
    for (let i = 1; i < all.length; i += 1) {
      expect(all[i - 1]!.createdAt.localeCompare(all[i]!.createdAt)).toBeGreaterThanOrEqual(0);
    }
  });

  it('markNotificationRead sets readAt for unread items', async () => {
    const token = await signIn();
    const updated = await markNotificationRead(token, 'ntf_001');
    expect(updated.readAt).not.toBeNull();
  });

  it('markAllNotificationsRead clears every unread', async () => {
    const token = await signIn();
    await markAllNotificationsRead(token);
    const all = await listNotifications(token);
    expect(all.every((n) => n.readAt != null)).toBe(true);
  });

  it('hides notifications owned by other users', async () => {
    // Demo user has ntf_001..003 by seed. Sign in as a fresh user via direct
    // session manipulation since we don't have a registration flow.
    mockState.sessions.set('mock_other', 'usr_friend');
    const all = await listNotifications('mock_other');
    expect(all).toHaveLength(0);
  });
});
