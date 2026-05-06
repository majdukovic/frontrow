import { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useDeepLinkScenario } from '../useDeepLinkScenario';
import { useQaStore } from '../../state/qa';
import { useAuthStore } from '../../state/auth';
import { useSettingsStore } from '../../state/settings';
import { mockState, resetMockState } from '../../mocks/state';

/**
 * The deep link hook is the contract between Maestro flows and the
 * app's internal state. Every flow that wants a known starting state
 * goes through one of these URLs:
 *
 *   frontrow://debug/seed/<id>          → apply scenario
 *   frontrow://debug/reset              → wipe mock state + triggers
 *   frontrow://debug/trigger/<kind>[/on|/off]
 *   frontrow://e2e/setup                → fast-boot for E2E (auth +
 *                                         onboarding done + clean
 *                                         state)
 *
 * Bugs in this routing silently break dozens of flows at once, so
 * each path is pinned with a deterministic fixture.
 *
 * We mock expo-linking to drive URL events synchronously without an
 * actual native bridge.
 */

let mockUrlHandler: ((event: { url: string }) => void) | null = null;
const mockRemoveListener = jest.fn();

jest.mock('expo-linking', () => ({
  parse: (url: string) => {
    // Mirror expo-linking's parse just enough for our tests:
    // frontrow://path/segments → { hostname: 'path', path: 'segments' }
    const m = /^frontrow:\/\/([^/?#]+)?(?:\/([^?#]*))?/.exec(url);
    return { hostname: m?.[1] ?? null, path: m?.[2] ?? null };
  },
  getInitialURL: jest.fn().mockResolvedValue(null),
  addEventListener: (_type: string, cb: (event: { url: string }) => void) => {
    mockUrlHandler = cb;
    return { remove: mockRemoveListener };
  },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

async function fireUrl(url: string) {
  await act(async () => {
    mockUrlHandler?.({ url });
    // Let any void'd async settle.
    await Promise.resolve();
  });
}

beforeEach(() => {
  mockUrlHandler = null;
  mockRemoveListener.mockReset();
  resetMockState();
  mockState.sessions.clear();
  useQaStore.setState({
    scenario: null,
    triggers: {
      push: false,
      geolocation: false,
      camera: false,
      biometric: false,
      imageUpload: false,
      sessionExpired: false,
      paymentTimeout: false,
      reviewSubmit: false,
    },
  });
  useAuthStore.setState({ token: null, user: null, hydrated: true });
  useSettingsStore.setState({ onboardingPending: true });
});

describe('debug/trigger', () => {
  it('enables a trigger when no on/off suffix is provided', async () => {
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://debug/trigger/paymentTimeout');
    expect(useQaStore.getState().triggers.paymentTimeout).toBe(true);
  });

  it('disables a trigger with /off suffix', async () => {
    useQaStore.getState().setTrigger('camera', true);
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://debug/trigger/camera/off');
    expect(useQaStore.getState().triggers.camera).toBe(false);
  });

  it('ignores unknown trigger names — silently no-ops', async () => {
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://debug/trigger/notARealTrigger');
    const triggers = useQaStore.getState().triggers;
    expect(Object.values(triggers).every((v) => v === false)).toBe(true);
  });
});

describe('debug/reset', () => {
  it('clears all triggers and the scenario', async () => {
    useQaStore.getState().setTrigger('push', true);
    useQaStore.setState({ scenario: 'soldOut' });
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://debug/reset');
    expect(useQaStore.getState().triggers.push).toBe(false);
    expect(useQaStore.getState().scenario).toBeNull();
  });
});

describe('debug/replayOnboarding', () => {
  it('flips onboardingPending to true so the carousel shows on next render', async () => {
    useSettingsStore.setState({ onboardingPending: false });
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://debug/replayOnboarding');
    expect(useSettingsStore.getState().onboardingPending).toBe(true);
  });
});

describe('e2e/setup', () => {
  it('signs in the demo user and issues a session token', async () => {
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://e2e/setup');
    const auth = useAuthStore.getState();
    expect(auth.token).toMatch(/^e2e_usr_demo_/);
    expect(auth.user?.email).toBe('demo@frontrow.app');
    // The session is registered server-side too (so authed API calls work).
    expect(mockState.sessions.get(auth.token!)).toBe('usr_demo');
  });

  it('marks onboarding as done', async () => {
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://e2e/setup');
    expect(useSettingsStore.getState().onboardingPending).toBe(false);
  });

  it('clears any active failure triggers', async () => {
    useQaStore.getState().setTrigger('paymentTimeout', true);
    useQaStore.getState().setTrigger('biometric', true);
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://e2e/setup');
    const triggers = useQaStore.getState().triggers;
    expect(Object.values(triggers).every((v) => v === false)).toBe(true);
  });

  it('strips password from the auth user (matches the API contract)', async () => {
    renderHook(() => useDeepLinkScenario(), { wrapper: makeWrapper() });
    await fireUrl('frontrow://e2e/setup');
    const user = useAuthStore.getState().user as Record<string, unknown> | null;
    expect(user).not.toBeNull();
    expect(user).not.toHaveProperty('password');
  });
});

describe('subscription lifecycle', () => {
  it('removes the URL listener on unmount', () => {
    const { unmount } = renderHook(() => useDeepLinkScenario(), {
      wrapper: makeWrapper(),
    });
    unmount();
    expect(mockRemoveListener).toHaveBeenCalledTimes(1);
  });
});
