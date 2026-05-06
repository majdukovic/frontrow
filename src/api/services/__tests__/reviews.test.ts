import { listReviewsForEvent, postReview, REVIEW_MAX_LENGTH } from '../reviews';
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

describe('reviews', () => {
  it('listReviewsForEvent returns reviews for that event in reverse-chronological order', async () => {
    const reviews = await listReviewsForEvent('evt_001');
    expect(reviews.length).toBeGreaterThan(0);
    for (let i = 1; i < reviews.length; i += 1) {
      expect(
        reviews[i - 1]!.createdAt.localeCompare(reviews[i]!.createdAt),
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it('postReview persists a new review', async () => {
    const token = await signIn();
    const r = await postReview(token, { eventId: 'evt_001', rating: 5, text: 'Great!' });
    expect(r.rating).toBe(5);
    expect(r.text).toBe('Great!');
    expect(r.userId).toBe('usr_demo');
  });

  it('postReview persists an attached imageUri', async () => {
    const token = await signIn();
    const r = await postReview(token, {
      eventId: 'evt_001',
      rating: 4,
      text: 'with photo',
      imageUri: 'file:///x.jpg',
    });
    expect(r.imageUri).toBe('file:///x.jpg');
  });

  it('rejects reviews longer than REVIEW_MAX_LENGTH', async () => {
    const token = await signIn();
    await expect(
      postReview(token, {
        eventId: 'evt_001',
        rating: 4,
        text: 'a'.repeat(REVIEW_MAX_LENGTH + 1),
      }),
    ).rejects.toMatchObject({ code: 'review_too_long' });
  });

  it('rejects unauthenticated posts', async () => {
    await expect(
      postReview(null, { eventId: 'evt_001', rating: 4, text: 'x' }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
