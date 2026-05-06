import { listMyTickets, purchaseTicket } from '../tickets';
import { postReview } from '../reviews';
import { login } from '../auth';
import { resetMockState, mockState } from '../../../mocks/state';
import { useQaStore } from '../../../state/qa';

async function signIn(): Promise<string> {
  const { token } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
  return token;
}

beforeEach(() => {
  resetMockState();
  mockState.sessions.clear();
  useQaStore.getState().clearTriggers();
  useQaStore.setState({ forceError: 'none' });
});

describe('failure triggers', () => {
  it('sessionExpired short-circuits any authed call with 401', async () => {
    const token = await signIn();
    useQaStore.getState().setTrigger('sessionExpired', true);
    await expect(listMyTickets(token)).rejects.toMatchObject({
      status: 401,
      code: 'session_expired',
    });
  });

  it('paymentTimeout fails purchase with 504', async () => {
    const token = await signIn();
    useQaStore.getState().setTrigger('paymentTimeout', true);
    await expect(
      purchaseTicket(token, { eventId: 'evt_001', quantity: 1 }),
    ).rejects.toMatchObject({ status: 504, code: 'payment_timeout' });
  });

  it('reviewSubmit fails postReview with 503 even on text-only reviews', async () => {
    const token = await signIn();
    useQaStore.getState().setTrigger('reviewSubmit', true);
    await expect(
      postReview(token, { eventId: 'evt_001', rating: 5, text: 'great show' }),
    ).rejects.toMatchObject({ status: 503, code: 'service_unavailable' });
  });

  it('imageUpload fails postReview only when an imageUri is present', async () => {
    const token = await signIn();
    useQaStore.getState().setTrigger('imageUpload', true);

    // Text-only review still succeeds.
    const ok = await postReview(token, { eventId: 'evt_001', rating: 5, text: 'no photo' });
    expect(ok.id).toBeTruthy();

    // With an image, it throws.
    await expect(
      postReview(token, {
        eventId: 'evt_001',
        rating: 5,
        text: 'with photo',
        imageUri: 'file:///x.jpg',
      }),
    ).rejects.toMatchObject({ status: 413, code: 'upload_failed' });
  });

  it('clearTriggers resets all flags', async () => {
    useQaStore.getState().setTrigger('paymentTimeout', true);
    useQaStore.getState().setTrigger('sessionExpired', true);
    useQaStore.getState().clearTriggers();
    const t = useQaStore.getState().triggers;
    expect(Object.values(t).every((v) => v === false)).toBe(true);
  });
});
