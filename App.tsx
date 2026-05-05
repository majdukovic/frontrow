import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';

import { RootNavigator } from './src/navigation/RootNavigator';
import { linking } from './src/navigation/linking';
import { i18n } from './src/i18n';
import { queryClient } from './src/hooks/queryClient';
import { useAuthStore } from './src/state/auth';
import { useQaStore } from './src/state/qa';
import { useDeepLinkScenario } from './src/hooks/useDeepLinkScenario';

function AppShell() {
  useDeepLinkScenario();
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateQa = useQaStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateAuth();
    void hydrateQa();
  }, [hydrateAuth, hydrateQa]);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <AppShell />
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
