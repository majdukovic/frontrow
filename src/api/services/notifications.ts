import { applyQaDelay, applyQaForcedError, ApiClientError } from '../client';
import { mockState } from '../../mocks/state';
import { now } from '../../state/qa';
import type { AppNotification } from '../types';

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

export async function listNotifications(token: string | null): Promise<AppNotification[]> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  return mockState.notifications
    .filter((n) => n.userId === userId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationRead(
  token: string | null,
  id: string,
): Promise<AppNotification> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const idx = mockState.notifications.findIndex((n) => n.id === id && n.userId === userId);
  if (idx === -1) {
    throw new ApiClientError(404, { code: 'not_found', message: 'Notification not found.' });
  }
  // Replace with a fresh object so React Query's structural sharing sees a
  // changed reference and the unread count re-derives.
  const updated: AppNotification = {
    ...mockState.notifications[idx]!,
    readAt: mockState.notifications[idx]!.readAt ?? now().toISOString(),
  };
  mockState.notifications[idx] = updated;
  return updated;
}

export async function markAllNotificationsRead(token: string | null): Promise<void> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const stamp = now().toISOString();
  mockState.notifications = mockState.notifications.map((n) =>
    n.userId === userId && !n.readAt ? { ...n, readAt: stamp } : n,
  );
}
