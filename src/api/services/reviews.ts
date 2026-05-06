import { applyQaDelay, applyQaForcedError, ApiClientError } from '../client';
import { mockState } from '../../mocks/state';
import { now } from '../../state/qa';
import type { Review } from '../types';

export const REVIEW_MAX_LENGTH = 280;

export async function listReviewsForEvent(eventId: string): Promise<Review[]> {
  await applyQaDelay();
  applyQaForcedError();
  return mockState.reviews
    .filter((r) => r.eventId === eventId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

let reviewCounter = 100;
function nextReviewId(): string {
  reviewCounter += 1;
  return `rev_${reviewCounter.toString().padStart(3, '0')}`;
}

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

export async function postReview(
  token: string | null,
  input: { eventId: string; rating: 1 | 2 | 3 | 4 | 5; text: string; imageUri?: string },
): Promise<Review> {
  await applyQaDelay();
  applyQaForcedError();
  const userId = requireUser(token);
  const trimmed = input.text.trim();
  if (trimmed.length > REVIEW_MAX_LENGTH) {
    throw new ApiClientError(400, {
      code: 'review_too_long',
      message: `Reviews are limited to ${REVIEW_MAX_LENGTH} characters.`,
    });
  }
  if (input.rating < 1 || input.rating > 5) {
    throw new ApiClientError(400, {
      code: 'invalid_rating',
      message: 'Rating must be between 1 and 5.',
    });
  }
  const event = mockState.events.find((e) => e.id === input.eventId);
  if (!event) {
    throw new ApiClientError(404, { code: 'not_found', message: 'Event not found.' });
  }
  const author = mockState.users.find((u) => u.id === userId);
  const review: Review = {
    id: nextReviewId(),
    eventId: input.eventId,
    userId,
    authorName: author?.displayName ?? 'You',
    rating: input.rating,
    text: trimmed,
    imageUri: input.imageUri,
    createdAt: now().toISOString(),
  };
  mockState.reviews.push(review);
  return review;
}
