import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';

import { RootNavigator } from './src/navigation/RootNavigator';
import { linking } from './src/navigation/linking';
import { i18n } from './src/i18n';
import { queryClient } from './src/hooks/queryClient';
import { useAuthStore } from './src/state/auth';
import { useQaStore } from './src/state/qa';
import { useBillingStore } from './src/state/billing';
import { useSettingsStore } from './src/state/settings';
import { useRecentlyViewedStore } from './src/state/recentlyViewed';
import { useDeepLinkScenario } from './src/hooks/useDeepLinkScenario';
import { ToastHost } from './src/components/ToastHost';
import { OfflineBanner } from './src/components/OfflineBanner';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { theme } from './src/theme';

function AppShell() {
  useDeepLinkScenario();
  useQaInvalidation();
  const onboardingPending = useSettingsStore((s) => s.onboardingPending);
  return (
    <NavigationContainer linking={linking}>
      <OfflineBanner />
      {onboardingPending ? <OnboardingScreen /> : <RootNavigator />}
      <ToastHost />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

/**
 * Whenever a QA toggle that affects API responses changes (force-error,
 * network delay, scenario), invalidate every React Query cache so the next
 * read picks up the new behavior. This makes debug-menu changes feel instant
 * and keeps tests deterministic.
 */
function useQaInvalidation() {
  const qc = useQueryClient();
  const forceError = useQaStore((s) => s.forceError);
  const networkDelayMs = useQaStore((s) => s.networkDelayMs);
  const scenario = useQaStore((s) => s.scenario);
  useEffect(() => {
    void qc.invalidateQueries();
  }, [qc, forceError, networkDelayMs, scenario]);
}

export default function App() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateQa = useQaStore((s) => s.hydrate);
  const hydrateBilling = useBillingStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateRecent = useRecentlyViewedStore((s) => s.hydrate);

  const authHydrated = useAuthStore((s) => s.hydrated);
  const qaHydrated = useQaStore((s) => s.hydrated);
  const billingHydrated = useBillingStore((s) => s.hydrated);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const recentHydrated = useRecentlyViewedStore((s) => s.hydrated);
  const allHydrated =
    authHydrated && qaHydrated && billingHydrated && settingsHydrated && recentHydrated;

  useEffect(() => {
    void hydrateAuth();
    void hydrateQa();
    void hydrateBilling();
    void hydrateSettings();
    void hydrateRecent();
  }, [hydrateAuth, hydrateQa, hydrateBilling, hydrateSettings, hydrateRecent]);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>{allHydrated ? <AppShell /> : <HydrationGate />}</ErrorBoundary>
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

function HydrationGate() {
  return (
    <View style={styles.gate} testID="app.hydrating">
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
